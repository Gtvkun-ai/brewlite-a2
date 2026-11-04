import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

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

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('GET /products delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue([mockProduct]);

    await expect(controller.findAll()).resolves.toEqual([mockProduct]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('GET /products/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue(mockProduct);

    await expect(controller.findOne('prod-1')).resolves.toEqual(mockProduct);
    expect(service.findOne).toHaveBeenCalledWith('prod-1');
  });

  it('GET /products/:id surfaces a 404 when the product is missing', async () => {
    service.findOne.mockRejectedValue(new NotFoundException());

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
