import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const TEST_SECRET = 'profile-test-secret-at-least-32-characters-long';

describe('User Profile & Account Management (/auth/me, /users/me, /auth/profile)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let customerToken: string;

  const mockDbUser = {
    id: 'user-cust-123',
    email: 'khachhang@brewlite.vn',
    passwordHash: '',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    address: '123 Nguyen Hue, Quan 1, TP.HCM',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date(),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'user-cust-123' || where.email === 'khachhang@brewlite.vn') {
          return Promise.resolve(mockDbUser);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        if (where.id === 'user-cust-123') {
          Object.assign(mockDbUser, data);
          return Promise.resolve(mockDbUser);
        }
        return Promise.resolve(null);
      }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    mockDbUser.passwordHash = await hash('OldPassword123!', 4);

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h', algorithm: 'HS256' },
        }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    jwt = moduleRef.get<JwtService>(JwtService);
    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    customerToken = jwt.sign({
      sub: 'user-cust-123',
      email: 'khachhang@brewlite.vn',
      role: Role.CUSTOMER,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/me & GET /users/me (Lấy thông tin cá nhân)', () => {
    it('GET /auth/me: trả về đầy đủ fullName, phone, address, email và role của người dùng', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: 'user-cust-123',
        email: 'khachhang@brewlite.vn',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        address: '123 Nguyen Hue, Quan 1, TP.HCM',
        role: Role.CUSTOMER,
      });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('GET /users/me: hoạt động tương thích hoàn toàn như /auth/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: 'user-cust-123',
        fullName: 'Nguyen Van A',
        email: 'khachhang@brewlite.vn',
      });
    });

    it('chặn 401 Unauthorized khi không gửi token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('PUT /auth/profile & PUT /users/me (Cập nhật thông tin cá nhân)', () => {
    it('cập nhật thành công họ tên, số điện thoại và địa chỉ nhận hàng', async () => {
      const updatePayload = {
        fullName: 'Nguyen Chi Gia Bao',
        phone: '0988776655',
        address: '456 Le Loi, Phuong Ben Nghe, Quan 1',
      };

      const res = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body).toMatchObject({
        fullName: 'Nguyen Chi Gia Bao',
        phone: '0988776655',
        address: '456 Le Loi, Phuong Ben Nghe, Quan 1',
      });
    });

    it('chặn 400 Bad Request khi gửi số điện thoại không hợp lệ', async () => {
      await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ phone: 'invalid-phone-abc' })
        .expect(400);
    });
  });

  describe('POST /auth/change-password (Đổi mật khẩu an toàn)', () => {
    it('từ chối 400 Bad Request khi mật khẩu hiện tại bị sai', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'WrongPassword999!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('Mật khẩu hiện tại không chính xác');
        });
    });

    it('cho phép đổi mật khẩu thành công khi cung cấp đúng mật khẩu hiện tại', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body.message).toContain('Đổi mật khẩu thành công');
        });
    });
  });

  describe('POST /auth/forgot-password & POST /auth/reset-password', () => {
    it('gửi yêu cầu quên mật khẩu thành công với email hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'khachhang@brewlite.vn' })
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('đặt lại mật khẩu mới thành công', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'khachhang@brewlite.vn',
          newPassword: 'FreshResetPassword123!',
        })
        .expect(200);

      expect(res.body.message).toContain('thành công');
    });
  });
});
