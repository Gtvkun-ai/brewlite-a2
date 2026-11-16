import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

const SECRET = 'catalog-security-tests-secret-at-least-32-characters';
const payload = {
  code: 'CF-SALT', name: 'Cà phê muối', basePrice: 39000,
  imageUrl: '/img/caphesua.jpg', category: 'Coffee', stockQuantity: 10,
};

describe('Catalog authorization and input validation', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let previousSecret: string | undefined;
  const prisma = { product: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } };

  beforeAll(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = SECRET;
    const module = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: SECRET })],
      controllers: [ProductsController],
      providers: [ProductsService, JwtStrategy, JwtAuthGuard, RolesGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.product.create.mockImplementation(async ({ data }) => ({ id: 'salt-coffee', ...data }));
  });

  afterAll(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const token = (role: Role) => jwt.sign({ sub: 'test-user', email: 'test@brewlite.vn', role });

  it.each(['post', 'patch', 'delete'] as const)('rejects unauthenticated %s mutations before database access', async (method) => {
    const url = method === 'post' ? '/products' : '/products/salt-coffee';
    await request(app.getHttpServer())[method](url).send(method === 'post' ? payload : { isAvailable: false }).expect(401);
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it.each([Role.CUSTOMER, Role.BARISTA])('denies catalog management for %s', async (role) => {
    await request(app.getHttpServer()).post('/products').set('Authorization', `Bearer ${token(role)}`).send(payload).expect(403);
    await request(app.getHttpServer()).patch('/products/salt-coffee').set('Authorization', `Bearer ${token(role)}`).send({ isAvailable: false }).expect(403);
    expect(prisma.product.create).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it.each([Role.ADMIN, Role.MANAGER])('allows %s to create products with a numeric string price and zero stock', async (role) => {
    await request(app.getHttpServer()).post('/products')
      .set('Authorization', `Bearer ${token(role)}`)
      .send({ ...payload, basePrice: '39000', stockQuantity: 0 }).expect(201);
    expect(prisma.product.create).toHaveBeenCalledWith({ data: expect.objectContaining({ basePrice: new Prisma.Decimal(39000), stockQuantity: 0 }) });
  });

  it.each([
    { basePrice: -1 }, { basePrice: 'oops' }, { basePrice: true }, { basePrice: '' },
    { stockQuantity: -1 }, { stockQuantity: 0.5 }, { stockQuantity: 2147483648 },
    { category: 'Other' }, { name: '  ' }, { imageUrl: 'javascript:alert(1)' },
    { isAvailable: null }, { stockQuantity: null },
  ])('rejects invalid product fields %j', async (invalid) => {
    await request(app.getHttpServer()).post('/products').set('Authorization', `Bearer ${token(Role.ADMIN)}`)
      .send({ ...payload, ...invalid }).expect(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('allows an authenticated admin to persist an availability toggle', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'salt-coffee', ...payload });
    prisma.product.update.mockResolvedValue({ id: 'salt-coffee', ...payload, isAvailable: false });
    await request(app.getHttpServer()).patch('/products/salt-coffee')
      .set('Authorization', `Bearer ${token(Role.ADMIN)}`)
      .send({ isAvailable: false }).expect(200).expect(({ body }) => expect(body.isAvailable).toBe(false));
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'salt-coffee' }, data: { isAvailable: false } });
  });

  it.each([{ basePrice: null }, { name: null }, { stockQuantity: null }, { isAvailable: null }])('rejects null updates %j before database access', async (invalid) => {
    await request(app.getHttpServer()).patch('/products/salt-coffee')
      .set('Authorization', `Bearer ${token(Role.ADMIN)}`).send(invalid).expect(400);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('reports a duplicate SKU race as a conflict', async () => {
    prisma.product.create.mockRejectedValue({ code: 'P2002' });
    await request(app.getHttpServer()).post('/products').set('Authorization', `Bearer ${token(Role.ADMIN)}`)
      .send(payload).expect(409);
  });

  it('preserves order history and explains why a referenced product cannot be deleted', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'salt-coffee', ...payload });
    prisma.product.delete.mockRejectedValue({ code: 'P2003' });
    await request(app.getHttpServer()).delete('/products/salt-coffee').set('Authorization', `Bearer ${token(Role.ADMIN)}`)
      .expect(409).expect(({ body }) => expect(body.message).toContain('giữ lịch sử đơn'));
  });
});
