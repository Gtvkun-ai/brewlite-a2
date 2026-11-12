import { Test } from '@nestjs/testing';
import { JwtModule, JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const TEST_SECRET = 'b20-security-test-secret-with-at-least-32-characters';
const TEST_PASSWORD = 'correct horse battery';

describe('Auth security integration', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let existingUser: {
    id: string;
    email: string;
    fullName: string;
    passwordHash: string;
    role: Role;
  };

  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    existingUser = {
      id: 'user-customer-1',
      email: 'customer@example.com',
      fullName: 'Test Customer',
      passwordHash: await hash(TEST_PASSWORD, 4),
      role: Role.CUSTOMER,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h', algorithm: 'HS256' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(() => {
    prisma.user.create.mockReset();
    prisma.user.findUnique.mockReset().mockResolvedValue(existingUser);
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  async function tokenFor(role: Role, expiresIn?: string): Promise<string> {
    const options: JwtSignOptions | undefined = expiresIn
      ? { expiresIn: expiresIn as JwtSignOptions['expiresIn'] }
      : undefined;
    return jwt.signAsync(
      {
        sub: `user-${role.toLowerCase()}`,
        email: `${role.toLowerCase()}@example.com`,
        role,
      },
      options,
    );
  }

  it('hashes passwords, does not accept role assignment, and returns no hash', async () => {
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'user-new-1',
      email: data.email,
      role: Role.CUSTOMER,
    }));

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'New Customer',
        email: 'new@example.com',
        password: TEST_PASSWORD,
      })
      .expect(201);

    const createData = prisma.user.create.mock.calls[0][0].data;
    expect(createData.passwordHash).not.toBe(TEST_PASSWORD);
    await expect(compare(TEST_PASSWORD, createData.passwordHash)).resolves.toBe(
      true,
    );
    expect(createData).not.toHaveProperty('role');
    expect(response.body).not.toHaveProperty('passwordHash');
    const tokenPayload = await jwt.verifyAsync(response.body.accessToken, {
      secret: TEST_SECRET,
    });
    expect(tokenPayload).toMatchObject({
      sub: 'user-new-1',
      role: Role.CUSTOMER,
    });
    expect(tokenPayload).not.toHaveProperty('passwordHash');
  });

  it('accepts optional phone number during registration and saves it to user record', async () => {
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'user-phone-1',
      email: data.email,
      role: Role.CUSTOMER,
    }));

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Phone Customer',
        email: 'phone@example.com',
        password: TEST_PASSWORD,
        phone: '0901234567',
      })
      .expect(201);

    const createData = prisma.user.create.mock.calls[0][0].data;
    expect(createData.phone).toBe('0901234567');
    expect(response.body).toHaveProperty('accessToken');
  });

  it('rejects a client-supplied role instead of allowing privilege escalation', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Attacker',
        email: 'attacker@example.com',
        password: TEST_PASSWORD,
        role: Role.ADMIN,
      })
      .expect(400);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('returns 409 when registration races with an existing email', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Duplicate',
        email: 'customer@example.com',
        password: TEST_PASSWORD,
      })
      .expect(409);
  });

  it('authenticates correct credentials and rejects incorrect credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: existingUser.email, password: TEST_PASSWORD })
      .expect(200)
      .expect(({ body }) => {
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body).not.toHaveProperty('passwordHash');
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: existingUser.email, password: 'wrong password' })
      .expect(401);
  });

  it.each([
    ['missing token', undefined],
    ['malformed token', 'not.a.jwt'],
  ])('blocks /auth/me with a %s', async (_caseName, accessToken) => {
    const testRequest = request(app.getHttpServer()).get('/auth/me');
    if (accessToken) {
      testRequest.set('Authorization', `Bearer ${accessToken}`);
    }
    await testRequest.expect(401);
  });

  it('blocks expired JWTs', async () => {
    const expiredToken = await tokenFor(Role.CUSTOMER, '-1s');
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('rejects JWTs with an invalid signature or unsupported role claim', async () => {
    const validToken = await tokenFor(Role.CUSTOMER);
    const tamperedToken = `${validToken.slice(0, -1)}${validToken.endsWith('a') ? 'b' : 'a'}`;

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);

    const invalidRoleToken = await jwt.signAsync({
      sub: 'user-unknown-role',
      email: 'unknown@example.com',
      role: 'OWNER',
    });
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${invalidRoleToken}`)
      .expect(401);
  });

  it('allows authenticated users to read their profile without exposing hashes', async () => {
    const accessToken = await tokenFor(Role.CUSTOMER);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ userId: 'user-customer', role: Role.CUSTOMER });
        expect(body).not.toHaveProperty('passwordHash');
      });
  });

  it('allows staff roles and denies customers on staff-only routes', async () => {
    const customerToken = await tokenFor(Role.CUSTOMER);
    await request(app.getHttpServer())
      .get('/auth/staff/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const staffToken = await tokenFor(Role.BARISTA);
    await request(app.getHttpServer())
      .get('/auth/staff/me')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.role).toBe(Role.BARISTA);
      });
  });
});
