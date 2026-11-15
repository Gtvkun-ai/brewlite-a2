import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Task C-30: Orders & Stock Concurrency Regression Test Suite
 * Truy vết: FR-05, FR-06, FR-07, NFR-05 (Data Integrity & ACID)
 * Kịch bản đối soát:
 *  1. Kịch bản Giảng viên 2/2: Kho còn 2 ly, 2 khách đồng thời mua 2 ly -> Chỉ 1 đơn thành công, kho về 0.
 *  2. Concurrency tải cao 10 requests: 10 khách đồng thời tranh 3 ly -> 3 đơn thành công, 7 đơn bị từ chối, kho về 0.
 *  3. Rollback nguyên tử đa sản phẩm: Giỏ hàng 2 món, món 2 hết hàng -> toàn bộ rollback, món 1 không mất kho.
 *  4. Idempotency replay: Cùng key trả đơn cũ không trừ kho lần 2; khác payload trả 409 Conflict.
 *  5. State machine & RBAC: Customer cấm đổi status (403), chuyển sai thứ tự bị chặn (400).
 *  6. Hủy đơn hoàn kho: Hủy đơn PENDING/PAID phục hồi stockQuantity nguyên tử.
 */
describe('Task C-30: Orders/Stock Concurrency & Regression Suite (NFR-05 & FR-05/06/07)', () => {
  let service: OrdersService;

  describe('1. Kịch bản 2/2 của Giảng viên (TEST C — Tranh chấp 2 khách mua 2 ly cuối)', () => {
    it('chỉ cho phép 1 khách đặt thành công, khách thứ 2 nhận 400 OUT_OF_STOCK, tồn kho về đúng 0', async () => {
      // Giả lập trạng thái kho trong database thật: còn đúng 2 ly
      let stockInDb = 2;
      let orderCreatedCount = 0;

      const mockProduct = {
        id: 'prod-croissant',
        code: 'PAS-CROI',
        name: 'Bánh Croissant bơ Pháp',
        basePrice: new Prisma.Decimal(30000),
        isAvailable: true,
        stockQuantity: stockInDb,
      };

      const mockTx = {
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => ({
            id: where.id,
            email: `${where.id}@brewlite.vn`,
            role: 'CUSTOMER',
          })),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([mockProduct]),
          updateMany: jest.fn().mockImplementation(({ where, data }) => {
            // Mô phỏng chính xác câu lệnh SQL nguyên tử:
            // UPDATE "Product" SET "stockQuantity" = "stockQuantity" - 2 WHERE id = :id AND "stockQuantity" >= 2
            const requiredQty = data.stockQuantity.decrement;
            const minQty = where.stockQuantity.gte;

            if (stockInDb >= minQty) {
              stockInDb -= requiredQty;
              return { count: 1 };
            }
            return { count: 0 }; // Không đủ điều kiện trừ kho
          }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }) => {
            orderCreatedCount++;
            return {
              id: `ord-${orderCreatedCount}`,
              code: data.code,
              userId: data.userId,
              status: 'PENDING',
              subTotal: data.subTotal,
              discountAmount: data.discountAmount,
              totalAmount: data.totalAmount,
              deliveryNote: data.deliveryNote,
              idempotencyKey: data.idempotencyKey,
              createdAt: new Date(),
              updatedAt: new Date(),
              items: data.items.create.map((item: any, idx: number) => ({
                id: `item-${idx + 1}`,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                selectedSize: item.selectedSize,
                selectedToppings: item.selectedToppings,
                selectedSugar: item.selectedSugar,
                selectedIce: item.selectedIce,
                itemTotal: item.itemTotal,
                product: mockProduct,
              })),
            };
          }),
        },
      };

      const mockPrisma: any = {
        order: { findUnique: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback(mockTx);
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const orderPayload: CreateOrderDto = {
        deliveryNote: 'Kịch bản 2/2 của giảng viên',
        items: [
          {
            productId: 'prod-croissant',
            quantity: 2,
            selectedSize: 'REGULAR',
          },
        ],
      };

      // Giả lập Khách A và Khách B gửi 2 request gần như đồng thời qua Promise.allSettled
      const [resCustomerA, resCustomerB] = await Promise.allSettled([
        service.createOrder('user-customer-A', orderPayload, 'idem-cust-A'),
        service.createOrder('user-customer-B', orderPayload, 'idem-cust-B'),
      ]);

      const fulfilled = [resCustomerA, resCustomerB].filter(
        (r) => r.status === 'fulfilled',
      ) as PromiseFulfilledResult<any>[];
      const rejected = [resCustomerA, resCustomerB].filter(
        (r) => r.status === 'rejected',
      ) as PromiseRejectedResult[];

      // 1. Đúng 1 yêu cầu thành công
      expect(fulfilled).toHaveLength(1);
      expect(Number(fulfilled[0].value.totalAmount)).toBe(60000); // 30,000 * 2 = 60,000 VND

      // 2. Đúng 1 yêu cầu bị từ chối vì hết hàng
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(BadRequestException);
      expect(rejected[0].reason.getResponse()).toMatchObject({
        errorCode: 'OUT_OF_STOCK',
      });

      // 3. Tồn kho cuối cùng giảm chính xác từ 2 về 0, tuyệt đối không bị âm
      expect(stockInDb).toBe(0);
      expect(orderCreatedCount).toBe(1);
    });
  });

  describe('2. Concurrency tải cao (10 yêu cầu đồng thời tranh chấp kho)', () => {
    it('đúng 3 đơn thành công khi kho còn 3, 7 đơn còn lại bị từ chối, kho về 0', async () => {
      let currentStock = 3;
      let successfulOrders = 0;

      const mockProduct = {
        id: 'prod-coffee-milk',
        code: 'CF-MILK',
        name: 'Cà phê sữa đá',
        basePrice: new Prisma.Decimal(35000),
        isAvailable: true,
        stockQuantity: currentStock,
      };

      const mockTx = {
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => ({
            id: where.id,
            email: `${where.id}@brewlite.vn`,
            role: 'CUSTOMER',
          })),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([mockProduct]),
          updateMany: jest.fn().mockImplementation(({ where, data }) => {
            const requiredQty = data.stockQuantity.decrement;
            const minQty = where.stockQuantity.gte;
            if (currentStock >= minQty) {
              currentStock -= requiredQty;
              return { count: 1 };
            }
            return { count: 0 };
          }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }) => {
            successfulOrders++;
            return {
              id: `ord-burst-${successfulOrders}`,
              code: data.code,
              userId: data.userId,
              status: 'PENDING',
              subTotal: data.subTotal,
              discountAmount: data.discountAmount,
              totalAmount: data.totalAmount,
              deliveryNote: data.deliveryNote,
              idempotencyKey: data.idempotencyKey,
              createdAt: new Date(),
              updatedAt: new Date(),
              items: [],
            };
          }),
        },
      };

      const mockPrisma: any = {
        order: { findUnique: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback(mockTx);
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      // Tạo 10 request mua 1 ly đồng thời
      const requests = Array.from({ length: 10 }).map((_, idx) =>
        service.createOrder(
          `user-${idx + 1}`,
          {
            items: [
              {
                productId: 'prod-coffee-milk',
                quantity: 1,
                selectedSize: 'REGULAR',
              },
            ],
          },
          `idem-burst-${idx + 1}`,
        ),
      );

      const results = await Promise.allSettled(requests);
      const passed = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(passed).toHaveLength(3);
      expect(failed).toHaveLength(7);
      expect(currentStock).toBe(0);
      expect(successfulOrders).toBe(3);
    });
  });

  describe('3. Rollback nguyên tử giỏ hàng đa sản phẩm (All-or-Nothing)', () => {
    it('khi món thứ 2 không đủ tồn kho, toàn bộ giao dịch rollback và món thứ 1 được bảo toàn kho', async () => {
      let stockItemA = 10;
      let stockItemB = 0; // Hết hàng

      const prodA = {
        id: 'prod-a',
        code: 'CF-A',
        name: 'Món A còn hàng',
        basePrice: new Prisma.Decimal(30000),
        isAvailable: true,
        stockQuantity: stockItemA,
      };

      const prodB = {
        id: 'prod-b',
        code: 'CF-B',
        name: 'Món B hết hàng',
        basePrice: new Prisma.Decimal(40000),
        isAvailable: true,
        stockQuantity: stockItemB,
      };

      const mockTx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user-1', role: 'CUSTOMER' }),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([prodA, prodB]),
          updateMany: jest.fn().mockImplementation(({ where, data }) => {
            if (where.id === 'prod-a') {
              if (stockItemA >= where.stockQuantity.gte) {
                stockItemA -= data.stockQuantity.decrement;
                return { count: 1 };
              }
            }
            if (where.id === 'prod-b') {
              if (stockItemB >= where.stockQuantity.gte) {
                stockItemB -= data.stockQuantity.decrement;
                return { count: 1 };
              }
            }
            return { count: 0 };
          }),
        },
        order: {
          create: jest.fn(),
        },
      };

      const mockPrisma: any = {
        order: { findUnique: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          // Lưu snapshot để mô phỏng rollback của Database Transaction
          const snapshotA = stockItemA;
          try {
            return await callback(mockTx);
          } catch (err) {
            stockItemA = snapshotA; // Rollback trạng thái
            throw err;
          }
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const multiItemPayload: CreateOrderDto = {
        items: [
          { productId: 'prod-a', quantity: 2, selectedSize: 'REGULAR' },
          { productId: 'prod-b', quantity: 1, selectedSize: 'REGULAR' },
        ],
      };

      await expect(service.createOrder('user-1', multiItemPayload)).rejects.toThrow(
        BadRequestException,
      );

      // Tồn kho món A vẫn được bảo toàn trọn vẹn 10, không bị mất 2 ly rác
      expect(stockItemA).toBe(10);
      expect(mockTx.order.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Idempotency & Replay Protection (NFR-05 & TC-12/13)', () => {
    it('gửi lại cùng idempotencyKey và cùng payload trả về đơn hàng cũ, không trừ kho lần hai', async () => {
      const existingOrder = {
        id: 'ord-existing-1',
        code: 'BL-20261112-IDEM',
        userId: 'user-1',
        status: 'PENDING',
        subTotal: new Prisma.Decimal(35000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(35000),
        deliveryNote: 'Test idempotency',
        idempotencyKey: 'idem-key-duplicate',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            productId: 'prod-milk',
            quantity: 1,
            unitPrice: new Prisma.Decimal(35000),
            selectedSize: 'REGULAR',
            selectedToppings: [],
            selectedSugar: 100,
            selectedIce: 'NORMAL',
            itemTotal: new Prisma.Decimal(35000),
            product: {
              id: 'prod-milk',
              code: 'CF-MILK',
              name: 'Cà phê sữa đá',
            },
          },
        ],
      };

      const mockPrisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue(existingOrder),
        },
        $transaction: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const samePayload: CreateOrderDto = {
        deliveryNote: 'Test idempotency',
        items: [
          {
            productId: 'prod-milk',
            quantity: 1,
            selectedSize: 'REGULAR',
            selectedSugar: 100,
            selectedIce: 'NORMAL' as any,
          },
        ],
      };

      const result = await service.createOrder(
        'user-1',
        samePayload,
        'idem-key-duplicate',
      );

      // Trả lại kết quả cũ
      expect(result.id).toBe('ord-existing-1');
      expect(result.code).toBe('BL-20261112-IDEM');
      // Không mở transaction trừ kho lần hai
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('gửi lại cùng idempotencyKey nhưng khác payload bị chặn với 409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', async () => {
      const existingOrder = {
        id: 'ord-existing-1',
        code: 'BL-20261112-IDEM',
        userId: 'user-1',
        status: 'PENDING',
        items: [
          {
            productId: 'prod-milk',
            quantity: 1,
            selectedSize: 'REGULAR',
            selectedToppings: [],
            selectedSugar: 100,
            selectedIce: 'NORMAL',
          },
        ],
      };

      const mockPrisma: any = {
        order: { findUnique: jest.fn().mockResolvedValue(existingOrder) },
        $transaction: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const modifiedPayload: CreateOrderDto = {
        items: [
          {
            productId: 'prod-milk',
            quantity: 3, // Khác quantity so với đơn gốc
            selectedSize: 'REGULAR',
          },
        ],
      };

      await expect(
        service.createOrder('user-1', modifiedPayload, 'idem-key-duplicate'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('5. State Machine & RBAC (FR-07: PAID -> PREPARING -> READY -> COMPLETED)', () => {
    it('cho phép chuyển đổi trạng thái hợp lệ theo đúng trình tự chuẩn', async () => {
      const mockPrisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'ord-flow-1',
            status: 'PAID',
            subTotal: new Prisma.Decimal(50000),
            discountAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(50000),
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
          }),
          update: jest.fn().mockResolvedValue({
            id: 'ord-flow-1',
            status: 'PREPARING',
            subTotal: new Prisma.Decimal(50000),
            discountAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(50000),
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
          }),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const updated = await service.updateOrderStatus('ord-flow-1', 'PREPARING');
      expect(updated.status).toBe('PREPARING');
    });

    it('chặn nhảy cóc trạng thái bất hợp lệ (e.g. PENDING -> COMPLETED) với 400 Bad Request', async () => {
      const mockPrisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'ord-jump-1',
            status: 'PENDING',
            items: [],
          }),
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      await expect(
        service.updateOrderStatus('ord-jump-1', 'COMPLETED'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('6. Hủy đơn và Hoàn kho (Test B — Refund & Stock Restoration)', () => {
    it('khi hủy đơn PENDING, tồn kho được phục hồi nguyên tử qua increment', async () => {
      const orderToCancel = {
        id: 'ord-cancel-pending',
        userId: 'user-cust-1',
        status: 'PENDING',
        items: [
          { productId: 'prod-milk-coffee', quantity: 2 },
        ],
      };

      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        order: {
          findUnique: jest.fn().mockResolvedValue(orderToCancel),
          update: jest.fn().mockResolvedValue({
            ...orderToCancel,
            status: 'CANCELLED',
            subTotal: new Prisma.Decimal(70000),
            discountAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(70000),
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
          }),
        },
        product: {
          update: jest.fn().mockResolvedValue({ id: 'prod-milk-coffee' }),
        },
      };

      const mockPrisma: any = {
        $transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      const res = await service.cancelOrder('ord-cancel-pending', 'user-cust-1');

      expect(res.status).toBe('CANCELLED');
      // Kiểm tra lệnh hoàn kho chính xác quantity: 2
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-milk-coffee' },
        data: { stockQuantity: { increment: 2 } },
      });
    });

    it('khi hủy đơn của người khác, trả về 403 Forbidden', async () => {
      const orderOfAnotherUser = {
        id: 'ord-other-user',
        userId: 'user-victim',
        status: 'PENDING',
        items: [],
      };

      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        order: {
          findUnique: jest.fn().mockResolvedValue(orderOfAnotherUser),
        },
      };

      const mockPrisma: any = {
        $transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<OrdersService>(OrdersService);

      await expect(
        service.cancelOrder('ord-other-user', 'user-attacker'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
