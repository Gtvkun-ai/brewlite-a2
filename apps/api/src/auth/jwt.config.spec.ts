import { getJwtExpiration, getJwtSecret } from './jwt.config';

describe('JWT configuration', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiration = process.env.JWT_EXPIRATION;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    if (originalExpiration === undefined) {
      delete process.env.JWT_EXPIRATION;
    } else {
      process.env.JWT_EXPIRATION = originalExpiration;
    }
  });

  it('fails closed when the JWT secret is missing or shorter than 32 characters', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET must be configured with at least 32 characters',
    );

    process.env.JWT_SECRET = 'too-short';
    expect(() => getJwtSecret()).toThrow(
      'JWT_SECRET must be configured with at least 32 characters',
    );
  });

  it('trims a configured secret and applies the documented expiration default', () => {
    process.env.JWT_SECRET = `  ${'s'.repeat(32)}  `;
    delete process.env.JWT_EXPIRATION;

    expect(getJwtSecret()).toBe('s'.repeat(32));
    expect(getJwtExpiration()).toBe('7d');
  });

  it('uses the configured token expiration', () => {
    process.env.JWT_EXPIRATION = '30m';

    expect(getJwtExpiration()).toBe('30m');
  });
});
