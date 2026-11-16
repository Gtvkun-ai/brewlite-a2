import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

const item = {
  productId: 'salt-coffee', quantity: 1, selectedSize: 'LARGE' as const,
  selectedToppings: ['TRAN_CHAU' as const], selectedSugar: 70 as const, selectedIce: 'LESS' as const,
};
const persisted = {
  id: 'order-demo', code: 'BL-TEST', userId: 'customer', status: 'PENDING',
  subTotal: '54000', discountAmount: '0', totalAmount: '54000',
  createdAt: new Date(), updatedAt: new Date(),
  items: [{ ...item, id: 'line', unitPrice: '54000', itemTotal: '54000', product: { name: 'Cà phê muối' } }],
};

describe('Per-drink preparation contract', () => {
  it('accepts 70% sugar and 50% ice with Large and topping', async () => {
    expect(await validate(plainToInstance(CreateOrderDto, { items: [item] }))).toEqual([]);
  });

  it.each([
    { selectedSugar: 69 }, { selectedSugar: '70' }, { selectedIce: 'UNKNOWN' },
    { selectedToppings: ['TRAN_CHAU', 'TRAN_CHAU'] },
  ])('rejects invalid preparation %j', async patch => {
    expect(await validate(plainToInstance(CreateOrderDto, { items: [{ ...item, ...patch }] }))).not.toHaveLength(0);
  });

  it('persists preparation and calculates 39k + 10k Large + 5k topping on server', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'customer' }) },
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: item.productId, name: 'Cà phê muối', basePrice: new Prisma.Decimal(39000), isAvailable: true }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: { create: jest.fn().mockImplementation(({ data }) => ({ ...persisted, ...data, items: data.items.create.map((line: object) => ({ ...line, id: 'line', product: { name: 'Cà phê muối' } })) })) },
    };
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn(callback => callback(tx)) };
    const service = new OrdersService(prisma as unknown as PrismaService);
    const response = await service.createOrder('customer', { items: [item] }, 'key-customization');
    expect(response.totalAmount).toBe('54000');
    expect(response.items[0]).toMatchObject({ selectedSugar: 70, selectedIce: 'LESS', selectedSize: 'LARGE', selectedToppings: ['TRAN_CHAU'] });
    expect(tx.order.create.mock.calls[0][0].data.items.create[0]).toMatchObject({ selectedSugar: 70, selectedIce: 'LESS' });
  });

  it.each([
    { selectedSugar: 50 as const }, { selectedIce: 'NORMAL' as const },
    { selectedToppings: [] }, { quantity: 2 },
  ])('rejects changed preparation on idempotent replay %j', async patch => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(persisted) }, $transaction: jest.fn() };
    const service = new OrdersService(prisma as unknown as PrismaService);
    await expect(service.createOrder('customer', { items: [{ ...item, ...patch }] }, 'key-customization')).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('replays matching complete configuration without deducting inventory twice', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(persisted) }, $transaction: jest.fn() };
    const service = new OrdersService(prisma as unknown as PrismaService);
    expect((await service.createOrder('customer', { items: [item] }, 'key-customization')).id).toBe(persisted.id);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
