import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct: Product = {
  id: 'prod-1',
  code: 'ESP-001',
  name: 'Classic Espresso',
  description: 'A bold single shot of our house espresso blend.',
  basePrice: '2.5' as unknown as Product['basePrice'],
  imageUrl: 'https://images.brewlite.local/espresso.jpg',
  category: 'Coffee',
  isAvailable: true,
  stockQuantity: 120,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('findAll returns the mocked product array', async () => {
    prisma.product.findMany.mockResolvedValue([mockProduct]);

    await expect(service.findAll()).resolves.toEqual([mockProduct]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  it('findOne returns a product when it exists', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);

    await expect(service.findOne('prod-1')).resolves.toEqual(mockProduct);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
    });
  });

  it('findOne throws NotFoundException for a missing id', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create creates and returns a new product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    prisma.product.create.mockResolvedValue(mockProduct);

    await expect(
      service.create({
        code: 'ESP-001',
        name: 'Classic Espresso',
        basePrice: 35000,
        imageUrl: '/img/esp.jpg',
        category: 'Coffee',
      }),
    ).resolves.toEqual(mockProduct);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('create throws ConflictException if product code exists', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);

    await expect(
      service.create({
        code: 'ESP-001',
        name: 'Classic Espresso',
        basePrice: 35000,
        imageUrl: '/img/esp.jpg',
        category: 'Coffee',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update modifies and returns the product', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.update.mockResolvedValue({
      ...mockProduct,
      isAvailable: false,
    });

    await expect(
      service.update('prod-1', { isAvailable: false }),
    ).resolves.toEqual({ ...mockProduct, isAvailable: false });
    expect(prisma.product.update).toHaveBeenCalledTimes(1);
  });

  it('remove deletes and returns the product', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.delete.mockResolvedValue(mockProduct);

    await expect(service.remove('prod-1')).resolves.toEqual(mockProduct);
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
    });
  });
});
