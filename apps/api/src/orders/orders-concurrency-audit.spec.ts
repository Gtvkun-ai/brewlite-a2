import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';

describe('Audited Concurrency & Security Tests (Lecturer Audit 2026-11-15)', () => {
  describe('YÊU CẦU C: Concurrency 2 khách cùng bấm mua 2 ly cuối cùng song song', () => {
    it('chạy Promise.all 2 khách cùng mua 2 ly cuối cùng: 1 người thành công, 1 người bị OUT_OF_STOCK, kho không bao giờ âm hoặc bán thành 4 ly', async () => {
      // Giả lập kho chỉ còn đúng 2 ly cuối cùng
      let currentStock = 2;
      const soldItems: number[] = [];

      const mockProduct = {
        id: 'prod-latte-final-2',
        code: 'CF-LATTE',
        name: 'Cà phê Latte',
        basePrice: new Prisma.Decimal(45000),
        isAvailable: true,
        stockQuantity: currentStock,
        category: 'Coffee',
        imageUrl: '/img/latte.jpg',
        createdAt: new Date(),
      };

      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        user: {
          findUnique: jest.fn().mockImplementation(({ where }) => ({
            id: where.id,
            email: `${where.id}@brewlite.local`,
            role: 'CUSTOMER',
          })),
        },
        product: {
          findMany: jest.fn().mockImplementation(() => [{
            ...mockProduct,
            stockQuantity: currentStock,
          }]),
          updateMany: jest.fn().mockImplementation(({ data }) => {
            const requiredQty = data.stockQuantity.decrement;
            // Atomic check: where.stockQuantity.gte
            if (currentStock >= requiredQty) {
              currentStock -= requiredQty;
              soldItems.push(requiredQty);
              return { count: 1 };
            }
            return { count: 0 }; // Không đủ tồn kho
          }),
        },
        order: {
          create: jest.fn().mockImplementation(({ data }) => ({
            id: `ord-${Math.random().toString(36).substring(7)}`,
            code: 'BL-TEST',
            userId: data.userId,
            status: 'PENDING',
            subTotal: data.subTotal,
            discountAmount: data.discountAmount,
            totalAmount: data.totalAmount,
            deliveryNote: data.deliveryNote,
            idempotencyKey: data.idempotencyKey,
            createdAt: new Date(),
            items: [
              {
                id: 'item-1',
                productId: mockProduct.id,
                quantity: 2,
                unitPrice: mockProduct.basePrice,
                selectedSize: 'REGULAR',
                selectedToppings: [],
                selectedSugar: 100,
                selectedIce: 'NORMAL',
                itemTotal: new Prisma.Decimal(90000),
                product: mockProduct,
              },
            ],
          })),
        },
      };

      const prismaMock = {
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return await callback(mockTx);
        }),
        order: {
          findUnique: jest.fn(),
        },
      };

      const ordersService = new OrdersService(prismaMock as any);

      const customer1OrderDto = {
        items: [{ productId: 'prod-latte-final-2', quantity: 2, selectedSize: 'REGULAR' as const }],
      };
      const customer2OrderDto = {
        items: [{ productId: 'prod-latte-final-2', quantity: 2, selectedSize: 'REGULAR' as const }],
      };

      // 2 khách hàng gửi request song song cùng lúc (Promise.all)
      const results = await Promise.allSettled([
        ordersService.createOrder('customer-1', customer1OrderDto, 'key-cust-1'),
        ordersService.createOrder('customer-2', customer2OrderDto, 'key-cust-2'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Chứng minh:
      // 1. Đúng 1 đơn hàng thành công, 1 đơn hàng bị từ chối
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // 2. Khách bị từ chối nhận lỗi OUT_OF_STOCK (400 Bad Request)
      const failureReason: any = (rejected[0] as PromiseRejectedResult).reason;
      expect(failureReason.getResponse()).toEqual(
        expect.objectContaining({
          errorCode: 'OUT_OF_STOCK',
        }),
      );

      // 3. Tồn kho sau cuộc đua về đúng 0 (không bị âm số lượng)
      expect(currentStock).toBe(0);

      // 4. Tổng số lượng bán ra đúng bằng 2 ly (không bao giờ bị bán thành 4 ly)
      const totalSold = soldItems.reduce((sum, q) => sum + q, 0);
      expect(totalSold).toBe(2);
    });
  });

  describe('YÊU CẦU C + D: Khách đã thanh toán (PAID) hủy cà phê (CANCELLED)', () => {
    it('hủy đơn hàng PAID: trạng thái chuyển CANCELLED, hoàn lại kho nguyên tử, thanh toán chuyển REFUND_PENDING', async () => {
      const orderPaid = {
        id: 'ord-paid-coffee-1',
        userId: 'customer-1',
        status: OrderStatus.PAID,
        items: [{ productId: 'prod-latte', quantity: 2 }],
      };

      let stockQuantity = 0;

      const txMock = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        order: {
          findUnique: jest.fn().mockResolvedValue(orderPaid),
          update: jest.fn().mockResolvedValue({
            ...orderPaid,
            status: OrderStatus.CANCELLED,
            subTotal: new Prisma.Decimal(90000),
            discountAmount: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(90000),
            createdAt: new Date(),
            items: [],
          }),
        },
        product: {
          update: jest.fn().mockImplementation(({ data }) => {
            stockQuantity += data.stockQuantity.increment;
            return { id: 'prod-latte', stockQuantity };
          }),
        },
        payment: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const prismaMock = {
        $transaction: jest.fn().mockImplementation(async (cb) => cb(txMock)),
      };

      const ordersService = new OrdersService(prismaMock as any);
      const res = await ordersService.cancelOrder('ord-paid-coffee-1', 'customer-1');

      // Kiểm chứng kết quả nghiệp vụ:
      expect(res.status).toBe(OrderStatus.CANCELLED);
      // Đã hoàn lại đúng 2 ly vào kho
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-latte' },
        data: { stockQuantity: { increment: 2 } },
      });
      expect(stockQuantity).toBe(2);
      // Đã cập nhật bản ghi thanh toán sang REFUND_PENDING
      expect(txMock.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'ord-paid-coffee-1', status: 'SUCCESS' },
        data: { status: PaymentStatus.REFUND_PENDING },
      });
    });
  });

  describe('YÊU CẦU D: Cố tình thanh toán đơn hàng đang CANCELLED', () => {
    it('chặn HTTP 409 Conflict (ORDER_NOT_PAYABLE) khi gửi request thanh toán cho đơn hàng đã bị hủy', async () => {
      const cancelledOrder = {
        id: 'ord-cancelled-1',
        userId: 'customer-1',
        status: OrderStatus.CANCELLED,
        totalAmount: new Prisma.Decimal(90000),
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      const txMock = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        order: {
          findFirst: jest.fn().mockResolvedValue(cancelledOrder),
        },
        payment: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      const prismaMock = {
        $transaction: jest.fn().mockImplementation(async (cb) => cb(txMock)),
      };

      const mockGateway = {} as any;
      const paymentsService = new PaymentsService(prismaMock as any, mockGateway);

      await expect(
        paymentsService.createPayment(
          'customer-1',
          { orderId: 'ord-cancelled-1', method: 'BREWPAY' as any, accountRef: '0901234567' },
          'idemp-key-cancelled-test',
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 409,
          response: expect.objectContaining({
            errorCode: 'ORDER_NOT_PAYABLE',
          }),
        }),
      );
    });
  });
});
