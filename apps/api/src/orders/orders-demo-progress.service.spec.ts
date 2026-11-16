import { Logger } from '@nestjs/common';
import { OrdersDemoProgressService } from './orders-demo-progress.service';

const prisma = {
  order: { findMany: jest.fn(), updateMany: jest.fn() },
};

describe('OrdersDemoProgressService', () => {
  let service: OrdersDemoProgressService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    service = new OrdersDemoProgressService(prisma as any);
    prisma.order.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    service.onModuleDestroy();
    process.env = originalEnv;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each([
    { NODE_ENV: 'production', DEMO_ORDER_PROGRESSION: 'true' },
    { NODE_ENV: 'development', DEMO_ORDER_PROGRESSION: 'false' },
    { NODE_ENV: 'development', DEMO_ORDER_PROGRESSION: undefined },
  ])('does not start when demo mode is disabled: %p', async (env) => {
    Object.assign(process.env, env);
    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('advances persisted eligible statuses using a conditional database update', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_ORDER_PROGRESSION = 'true';
    prisma.order.findMany.mockResolvedValue([
      { id: 'paid', status: 'PAID' },
      { id: 'preparing', status: 'PREPARING' },
      { id: 'ready', status: 'READY' },
    ]);
    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(2000);
    expect(prisma.order.updateMany).toHaveBeenCalledTimes(3);
    expect(prisma.order.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'paid', status: 'PAID', updatedAt: { lte: expect.any(Date) } },
      data: { status: 'PREPARING' },
    });
    expect(prisma.order.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: { status: 'READY' } }));
    expect(prisma.order.updateMany).toHaveBeenNthCalledWith(3, expect.objectContaining({ data: { status: 'COMPLETED' } }));
    service.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(10_000);
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
  });

  it('does not overlap database polling while an earlier query is pending', async () => {
    let resolve: (value: any[]) => void = () => {};
    prisma.order.findMany.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const first = service.advanceOrders();
    await service.advanceOrders();
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
    resolve([]);
    await first;
    await service.advanceOrders();
    expect(prisma.order.findMany).toHaveBeenCalledTimes(2);
  });
});
