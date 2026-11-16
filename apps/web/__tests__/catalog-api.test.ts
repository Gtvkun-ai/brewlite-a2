import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, FALLBACK_PRODUCTS, fetchProduct, fetchProducts } from '../lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Catalog API fixture boundary', () => {
  it('surfaces real network failures without inventing purchasable product IDs', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'false');
    const failure = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    await expect(fetchProducts()).rejects.toBe(failure);
    await expect(fetchProduct('prod-salt-coffee')).rejects.toBe(failure);
  });

  it('allows explicit offline fixtures while admin and cart can require a real catalog', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
    const failure = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    await expect(fetchProducts()).resolves.toEqual(FALLBACK_PRODUCTS);
    await expect(fetchProduct('prod-salt-coffee')).resolves.toMatchObject({ name: 'Cà phê muối' });
    await expect(fetchProducts({ fallbackOnNetworkError: false })).rejects.toBe(failure);
  });

  it('does not replace HTTP failures with sample data even in fixture mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchProducts()).rejects.toBeInstanceOf(ApiError);
    await expect(fetchProduct('prod-salt-coffee')).rejects.toMatchObject({ status: 503 });
  });
});
