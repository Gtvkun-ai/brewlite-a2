import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const TEST_SECRET = 'orders-security-test-secret-at-least-32-chars';

describe('Orders Security & Validation HTTP Integration', () => {
  let app: INestApplication;
  let jwt: JwtService;

  let customerToken: string;
  let baristaToken: string;

  const mockOrdersService = {
    createOrder: jest.fn(),
    findUserOrders: jest.fn(),
    findOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
  };

  const prisma = {};

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h', algorithm: 'HS256' },
        }),
      ],
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: PrismaService, useValue: prisma },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    jwt = moduleRef.get<JwtService>(JwtService);
    app = moduleRef.createNestApplication();

    // Áp dụng đúng ValidationPipe toàn cục như main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    customerToken = jwt.sign({
      sub: 'cust-1',
      email: 'customer@brewlite.local',
      role: Role.CUSTOMER,
    });

    baristaToken = jwt.sign({
      sub: 'barista-1',
      email: 'barista@brewlite.local',
      role: Role.BARISTA,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('TEST A — Bảo vệ giá API (Chống sửa giá phía client)', () => {
    it('chặn 400 Bad Request ngay lập tức khi client cố tình gửi kèm trường price', async () => {
      const hackPayload = {
        deliveryNote: 'Hacking price',
        items: [
          {
            productId: 'cly123',
            quantity: 1,
            selectedSize: 'REGULAR',
            price: 1000, // Trường giả mạo giá rẻ
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(hackPayload)
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('price should not exist')]),
          );
        });

      // Đảm bảo không bao giờ lọt vào service
      expect(mockOrdersService.createOrder).not.toHaveBeenCalled();
    });

    it('chặn 400 Bad Request khi client gửi selectedSize không hợp lệ', async () => {
      const invalidPayload = {
        items: [
          {
            productId: 'cly123',
            quantity: 1,
            selectedSize: 'EXTRA_LARGE', // Không hợp lệ
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('chặn 401 Unauthorized khi không gửi Bearer token', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          items: [{ productId: 'cly123', quantity: 1, selectedSize: 'REGULAR' }],
        })
        .expect(401);
    });
  });

  describe('FR-07 — Phân quyền trạng thái đơn hàng (RolesGuard & State Machine)', () => {
    it('chặn 403 Forbidden khi khách hàng (CUSTOMER) cố tình gọi PATCH /orders/:id/status', async () => {
      await request(app.getHttpServer())
        .patch('/orders/ord-999/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PREPARING' })
        .expect(403)
        .expect(({ body }) => {
          expect(body.message).toContain('Insufficient role');
        });
    });

    it('cho phép nhân viên (BARISTA) cập nhật trạng thái đơn hàng thành công 200 OK', async () => {
      mockOrdersService.updateOrderStatus.mockResolvedValueOnce({
        id: 'ord-999',
        status: 'PREPARING',
      });

      await request(app.getHttpServer())
        .patch('/orders/ord-999/status')
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({ status: 'PREPARING' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe('PREPARING');
        });

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'ord-999',
        'PREPARING',
      );
    });
  });
});
