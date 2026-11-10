import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns database up when the probe succeeds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) };
    const result = await new HealthController(prisma as never).root();

    expect(result).toMatchObject({
      status: 'ok',
      database: { status: 'up' },
    });
  });

  it('returns 503 when the database probe fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    };

    await expect(new HealthController(prisma as never).ready()).rejects.toMatchObject({
      status: 503,
      response: {
        status: 'error',
        database: {
          status: 'down',
          error: 'Connection to PostgreSQL failed',
        },
      },
    });
  });

  it('keeps liveness independent from the database', () => {
    expect(new HealthController({} as never).live()).toMatchObject({
      status: 'ok',
    });
  });
});
