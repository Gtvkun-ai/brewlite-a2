import { Prisma, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { MockGatewayService } from './mock-gateway.service';
import { PaymentsService } from './payments.service';

function fixture() {
  const order = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    totalAmount: new Prisma.Decimal(45000),
    items: [{ productId: 'product-1', quantity: 2 }],
  };
  const payments: any[] = [];
  const tx: any = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: order.id }]),
    order: {
      findFirst: jest.fn().mockImplementation(async () => order),
      updateMany: jest.fn().mockImplementation(async ({ data }) => {
        order.status = data.status;
        return { count: 1 };
      }),
    },
    payment: {
      findUnique: jest.fn().mockImplementation(async ({ where }) =>
        payments.find((payment) => payment.idempotencyKey === where.idempotencyKey) ?? null),
      create: jest.fn().mockImplementation(async ({ data }) => {
        const payment = {
          id: `payment-${payments.length + 1}`,
          createdAt: new Date('2026-11-09T00:00:00.000Z'),
          transactionRef: null,
          paymentGatewayResponse: null,
          ...data,
        };
        payments.push(payment);
        return payment;
      }),
    },
    product: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx)),
  };

  return {
    order,
    payments,
    tx,
    prisma,
    service: new PaymentsService(
      prisma as never,
      new MockGatewayService(),
    ),
  };
}

describe('PaymentsService', () => {
  it('uses persisted order amount and marks a successful payment as PAID', async () => {
    const f = fixture();

    const result = await f.service.createPayment(
      'user-1',
      {
        orderId: 'order-1',
        method: PaymentMethod.E_WALLET,
        accountRef: 'demo-1234',
      },
      'payment-key-1',
    );

    expect(result).toMatchObject({
      status: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.PAID,
      amount: '45000',
    });
    expect(f.payments[0].amount.toString()).toBe('45000');
    expect(f.order.status).toBe(OrderStatus.PAID);
  });

  it('marks failure and releases reserved inventory', async () => {
    const f = fixture();

    const result = await f.service.createPayment(
      'user-1',
      {
        orderId: 'order-1',
        method: PaymentMethod.DOMESTIC_ATM,
        accountRef: 'demo-0000',
      },
      'payment-key-2',
    );

    expect(result).toMatchObject({
      status: PaymentStatus.FAILED,
      orderStatus: OrderStatus.PAYMENT_FAILED,
    });
    expect(f.tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stockQuantity: { increment: 2 } },
    });
  });

  it('rejects a payment for another user', async () => {
    const f = fixture();
    f.tx.order.findFirst.mockResolvedValue(null);

    await expect(
      f.service.createPayment(
        'user-2',
        {
          orderId: 'order-1',
          method: PaymentMethod.E_WALLET,
          accountRef: 'demo-1234',
        },
        'payment-key-3',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replays the same key and rejects a changed payload', async () => {
    const f = fixture();
    const dto = {
      orderId: 'order-1',
      method: PaymentMethod.E_WALLET,
      accountRef: 'demo-1234',
    };

    const first = await f.service.createPayment('user-1', dto, 'payment-key-4');
    const replay = await f.service.createPayment('user-1', dto, 'payment-key-4');

    expect(replay).toEqual(first);
    expect(f.payments).toHaveLength(1);
    await expect(
      f.service.createPayment(
        'user-1',
        { ...dto, method: PaymentMethod.CREDIT_CARD },
        'payment-key-4',
      ),
    ).rejects.toMatchObject({
      response: { errorCode: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' },
    });
  });
});
