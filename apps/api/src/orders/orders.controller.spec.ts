import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: {
    createOrder: jest.Mock;
    findUserOrders: jest.Mock;
    findOrderById: jest.Mock;
    cancelOrder: jest.Mock;
    updateOrderStatus: jest.Mock;
  };

  const mockResponse: OrderResponseDto = {
    id: 'ord-123',
    code: 'BL-20261108-0001',
    userId: 'user-1',
    status: 'PENDING',
    subTotal: '50000',
    discountAmount: '0',
    totalAmount: '50000',
    deliveryNote: 'Giao tại bàn',
    idempotencyKey: 'idemp-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        productId: 'prod-milk-coffee',
        productName: 'Cà phê sữa đá',
        quantity: 1,
        unitPrice: '50000',
        selectedSize: 'LARGE',
        selectedToppings: ['TRAN_CHAU'],
        itemTotal: '50000',
      },
    ],
  };

  beforeEach(async () => {
    service = {
      createOrder: jest.fn().mockResolvedValue(mockResponse),
      findUserOrders: jest.fn().mockResolvedValue([mockResponse]),
      findOrderById: jest.fn().mockResolvedValue(mockResponse),
      cancelOrder: jest.fn().mockResolvedValue({ ...mockResponse, status: 'CANCELLED' }),
      updateOrderStatus: jest.fn().mockResolvedValue({ ...mockResponse, status: 'PREPARING' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('delegates order creation to OrdersService', async () => {
    const dto: CreateOrderDto = {
      deliveryNote: 'Giao tại bàn',
      items: [
        {
          productId: 'prod-milk-coffee',
          quantity: 1,
          selectedSize: 'LARGE',
          selectedToppings: ['TRAN_CHAU'],
        },
      ],
    };

    const result = await controller.create('user-1', dto, 'idemp-123');
    expect(result).toEqual(mockResponse);
    expect(service.createOrder).toHaveBeenCalledWith('user-1', dto, 'idemp-123');
  });

  it('delegates getMyOrders to OrdersService', async () => {
    const result = await controller.getMyOrders('user-1');
    expect(result).toEqual([mockResponse]);
    expect(service.findUserOrders).toHaveBeenCalledWith('user-1');
  });

  it('delegates getOrderById to OrdersService with role', async () => {
    const req = { user: { role: 'BARISTA' } };
    const result = await controller.getOrderById('ord-123', 'user-1', req);
    expect(result).toEqual(mockResponse);
    expect(service.findOrderById).toHaveBeenCalledWith('ord-123', 'user-1', 'BARISTA');
  });

  it('delegates cancelOrder to OrdersService', async () => {
    const result = await controller.cancelOrder('ord-123', 'user-1');
    expect(result.status).toBe('CANCELLED');
    expect(service.cancelOrder).toHaveBeenCalledWith('ord-123', 'user-1');
  });

  it('delegates updateStatus to OrdersService (FR-07 Staff action)', async () => {
    const dto: UpdateOrderStatusDto = { status: 'PREPARING' };
    const result = await controller.updateStatus('ord-123', dto);
    expect(result.status).toBe('PREPARING');
    expect(service.updateOrderStatus).toHaveBeenCalledWith('ord-123', 'PREPARING');
  });
});
