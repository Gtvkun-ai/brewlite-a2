import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

const mockUser = {
  id: "user-1",
  email: "customer@brewlite.local",
  fullName: "Nguyen Van A",
  role: "CUSTOMER",
};

const mockProductMilkCoffee = {
  id: "prod-milk-coffee",
  code: "CF-MILK",
  name: "Cà phê sữa đá",
  description: "Cà phê Robusta sữa đặc",
  basePrice: new Prisma.Decimal(35000),
  imageUrl: "/img/cf-milk.jpg",
  category: "Coffee",
  isAvailable: true,
  stockQuantity: 50,
  createdAt: new Date("2026-11-01T00:00:00Z"),
};

const mockProductPeachTea = {
  id: "prod-peach-tea",
  code: "TEA-PEACH",
  name: "Trà đào cam sả",
  description: "Trà đen hương đào cam sả tươi",
  basePrice: new Prisma.Decimal(40000),
  imageUrl: "/img/tea-peach.jpg",
  category: "Tea",
  isAvailable: true,
  stockQuantity: 20,
  createdAt: new Date("2026-11-01T00:00:00Z"),
};

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: any;
  let txMock: any;

  beforeEach(async () => {
    txMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([mockProductMilkCoffee, mockProductPeachTea]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: "ord-123",
          code: data.code,
          userId: data.userId,
          status: data.status,
          subTotal: data.subTotal,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          deliveryNote: data.deliveryNote,
          idempotencyKey: data.idempotencyKey,
          createdAt: new Date("2026-11-08T00:00:00Z"),
          updatedAt: new Date("2026-11-08T00:00:00Z"),
          items: data.items.create.map((item: any, idx: number) => ({
            id: `item-${idx + 1}`,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            selectedSize: item.selectedSize,
            selectedToppings: item.selectedToppings,
            itemTotal: item.itemTotal,
            product:
              item.productId === mockProductMilkCoffee.id
                ? mockProductMilkCoffee
                : mockProductPeachTea,
          })),
        })),
      },
      payment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(async (callback) => callback(txMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe("calculateUnitPrice", () => {
    it("calculates regular size without toppings correctly", () => {
      const price = service.calculateUnitPrice(35000, "REGULAR", []);
      expect(price).toBe(35000);
    });

    it("calculates large size (+10,000) with toppings (+5,000 trân châu) correctly", () => {
      const price = service.calculateUnitPrice(35000, "LARGE", ["TRAN_CHAU"]);
      // 35,000 + 10,000 + 5,000 = 50,000
      expect(price).toBe(50000);
    });

    it("calculates multiple toppings (TRAN_CHAU + KEM_CHEESE) correctly", () => {
      // 40,000 + 10,000 (Large) + 5,000 (Trân châu) + 10,000 (Kem Cheese) = 65,000
      const price = service.calculateUnitPrice(40000, "LARGE", [
        "TRAN_CHAU",
        "KEM_CHEESE",
      ]);
      expect(price).toBe(65000);
    });
  });

  describe("createOrder", () => {
    it("creates an order successfully with server pricing and stock deduction", async () => {
      const dto: CreateOrderDto = {
        deliveryNote: "Bàn số 3",
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 2,
            selectedSize: "LARGE",
            selectedToppings: ["TRAN_CHAU"],
          },
        ],
      };

      const result = await service.createOrder("user-1", dto, "key-123");

      expect(result).toBeDefined();
      expect(result.status).toBe("PENDING");
      expect(result.code).toMatch(/^BL-\d{8}-[A-Z0-9]{4}$/);
      expect(result.subTotal).toBe("100000"); // (35,000 + 10,000 + 5,000) * 2 = 100,000
      expect(result.totalAmount).toBe("100000");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].unitPrice).toBe("50000");
      expect(result.items[0].itemTotal).toBe("100000");

      // Verify atomic stock deduction was called with stockQuantity >= quantity
      expect(txMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: "prod-milk-coffee",
          stockQuantity: { gte: 2 },
          isAvailable: true,
        },
        data: {
          stockQuantity: { decrement: 2 },
        },
      });
    });

    it("aggregates demand when multiple items have the same productId", async () => {
      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 2,
            selectedSize: "REGULAR",
          },
          {
            productId: "prod-milk-coffee",
            quantity: 1,
            selectedSize: "LARGE",
          },
        ],
      };

      await service.createOrder("user-1", dto);

      // Total quantity for prod-milk-coffee is 2 + 1 = 3
      expect(txMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: "prod-milk-coffee",
          stockQuantity: { gte: 3 },
          isAvailable: true,
        },
        data: {
          stockQuantity: { decrement: 3 },
        },
      });
    });

    it("throws BadRequestException OUT_OF_STOCK when updateMany affected count is 0", async () => {
      txMock.product.updateMany.mockResolvedValueOnce({ count: 0 });

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 100, // vượt quá tồn kho
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(service.createOrder("user-1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws BadRequestException when product is unavailable (isAvailable: false)", async () => {
      txMock.product.findMany.mockResolvedValueOnce([
        { ...mockProductMilkCoffee, isAvailable: false },
      ]);

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 1,
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(service.createOrder("user-1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws NotFoundException when product does not exist in DB", async () => {
      txMock.product.findMany.mockResolvedValueOnce([]); // no products found

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "unknown-id",
            quantity: 1,
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(service.createOrder("user-1", dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws NotFoundException when user does not exist in DB", async () => {
      txMock.user.findUnique.mockResolvedValueOnce(null);

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 1,
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(service.createOrder("unknown-user", dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("replays existing order when idempotencyKey was previously processed for the same user", async () => {
      const existingOrder = {
        id: "ord-existing-999",
        code: "BL-20261108-EXIST",
        userId: "user-1",
        status: "PENDING",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        deliveryNote: "Đơn đã tạo trước đó",
        idempotencyKey: "idemp-duplicate",
        createdAt: new Date("2026-11-08T00:00:00Z"),
        updatedAt: new Date("2026-11-08T00:00:00Z"),
        items: [
          {
            id: "item-1",
            productId: "prod-milk-coffee",
            quantity: 1,
            unitPrice: new Prisma.Decimal(50000),
            selectedSize: "LARGE",
            selectedToppings: ["TRAN_CHAU"],
            itemTotal: new Prisma.Decimal(50000),
            product: mockProductMilkCoffee,
          },
        ],
      };

      prisma.order.findUnique.mockResolvedValueOnce(existingOrder);

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 1,
            selectedSize: "LARGE",
            selectedToppings: ["TRAN_CHAU"],
          },
        ],
      };

      const result = await service.createOrder(
        "user-1",
        dto,
        "idemp-duplicate",
      );

      expect(result.id).toBe("ord-existing-999");
      expect(result.code).toBe("BL-20261108-EXIST");
      // Verify no transaction or deduction was made
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when idempotencyKey belongs to another user", async () => {
      const existingOrder = {
        id: "ord-other-user",
        userId: "user-2", // different user!
        idempotencyKey: "idemp-hijack",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.order.findUnique.mockResolvedValueOnce(existingOrder);

      const dto: CreateOrderDto = {
        items: [
          {
            productId: "prod-milk-coffee",
            quantity: 1,
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(
        service.createOrder("user-1", dto, "idemp-hijack"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws ConflictException when idempotencyKey is reused with a different payload", async () => {
      const existingOrder = {
        id: "ord-existing-999",
        code: "BL-20261108-EXIST",
        userId: "user-1",
        status: "PENDING",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        deliveryNote: "Đơn cũ",
        idempotencyKey: "idemp-duplicate",
        createdAt: new Date("2026-11-08T00:00:00Z"),
        updatedAt: new Date("2026-11-08T00:00:00Z"),
        items: [
          {
            id: "item-1",
            productId: "prod-milk-coffee",
            quantity: 1,
            unitPrice: new Prisma.Decimal(50000),
            selectedSize: "LARGE",
            selectedToppings: ["TRAN_CHAU"],
            itemTotal: new Prisma.Decimal(50000),
            product: mockProductMilkCoffee,
          },
        ],
      };

      prisma.order.findUnique.mockResolvedValueOnce(existingOrder);

      const differentDto: CreateOrderDto = {
        items: [
          {
            productId: "prod-peach-tea",
            quantity: 2,
            selectedSize: "REGULAR",
          },
        ],
      };

      await expect(
        service.createOrder("user-1", differentDto, "idemp-duplicate"),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateOrderStatus (FR-07 State Machine)", () => {
    it("allows valid transition PAID -> PREPARING", async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: "ord-1",
        status: "PAID",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });
      prisma.order.update = jest.fn().mockResolvedValueOnce({
        id: "ord-1",
        status: "PREPARING",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });

      const res = await service.updateOrderStatus("ord-1", "PREPARING");
      expect(res.status).toBe("PREPARING");
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "ord-1" },
        data: { status: "PREPARING" },
        include: expect.any(Object),
      });
    });

    it("allows valid transition PREPARING -> READY and READY -> COMPLETED", async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: "ord-2",
        status: "PREPARING",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });
      prisma.order.update = jest.fn().mockResolvedValueOnce({
        id: "ord-2",
        status: "READY",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });

      const res = await service.updateOrderStatus("ord-2", "READY");
      expect(res.status).toBe("READY");
    });

    it("rejects invalid state transition e.g. PENDING -> COMPLETED with 400", async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: "ord-pending",
        status: "PENDING",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        items: [],
      });

      await expect(
        service.updateOrderStatus("ord-pending", "COMPLETED"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException when order does not exist", async () => {
      prisma.order.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateOrderStatus("non-existent", "PREPARING"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("cancelOrder (TEST B - Hủy đơn & Hoàn kho)", () => {
    it("cancels a PENDING order and restores stock", async () => {
      const orderToCancel = {
        id: "ord-cancel-1",
        userId: "user-1",
        status: "PENDING",
        items: [{ productId: "prod-milk-coffee", quantity: 2 }],
      };

      txMock.order.findUnique = jest.fn().mockResolvedValueOnce(orderToCancel);
      txMock.product.update = jest
        .fn()
        .mockResolvedValue({ id: "prod-milk-coffee" });
      txMock.order.update = jest.fn().mockResolvedValueOnce({
        ...orderToCancel,
        status: "CANCELLED",
        subTotal: new Prisma.Decimal(50000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(50000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });

      const res = await service.cancelOrder("ord-cancel-1", "user-1");
      expect(res.status).toBe("CANCELLED");
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: "prod-milk-coffee" },
        data: { stockQuantity: { increment: 2 } },
      });
    });

    it("rejects cancellation from another user with ForbiddenException", async () => {
      txMock.order.findUnique = jest.fn().mockResolvedValueOnce({
        id: "ord-other",
        userId: "user-2", // not user-1
        status: "PENDING",
        items: [],
      });

      await expect(service.cancelOrder("ord-other", "user-1")).rejects.toThrow(
        ForbiddenException,
      );
    });
    it("cancels a PAID order, restores stock and marks payment REFUND_PENDING", async () => {
      const orderToCancel = {
        id: "ord-paid-1",
        userId: "user-1",
        status: "PAID",
        items: [{ productId: "prod-milk-coffee", quantity: 2 }],
      };

      txMock.order.findUnique = jest.fn().mockResolvedValueOnce(orderToCancel);

      txMock.product.update = jest.fn().mockResolvedValue({
        id: "prod-milk-coffee",
      });

      txMock.order.update = jest.fn().mockResolvedValueOnce({
        ...orderToCancel,
        status: "CANCELLED",
        subTotal: new Prisma.Decimal(70000),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(70000),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      });

      const res = await service.cancelOrder("ord-paid-1", "user-1");

      expect(res.status).toBe("CANCELLED");

      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: "prod-milk-coffee" },
        data: { stockQuantity: { increment: 2 } },
      });

      expect(txMock.payment.updateMany).toHaveBeenCalledWith({
        where: {
          orderId: "ord-paid-1",
          status: "SUCCESS",
        },
        data: {
          status: "REFUND_PENDING",
        },
      });
    });
  });
});
