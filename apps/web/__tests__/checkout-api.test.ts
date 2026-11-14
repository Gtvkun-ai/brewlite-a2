import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOrderApi, submitPaymentApi } from '../lib/checkout-api';

const orderRequest = {
  items: [{
    productId: 'coffee-salt', quantity: 1, selectedSize: 'LARGE' as const,
    selectedToppings: ['KEM_CHEESE' as const], selectedSugar: 70 as const,
    selectedIce: 'LESS' as const,
  }],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('checkout API transport', () => {
  it('sends per-item preparation options and a stable order request key without trusting client prices', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'o1' }) });
    vi.stubGlobal('fetch', fetchMock);
    await createOrderApi(orderRequest, 'test-token', 'order:stable-key');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/orders$/), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', Authorization: 'Bearer test-token',
        'Idempotency-Key': 'order:stable-key',
      },
      body: JSON.stringify(orderRequest),
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('totalAmount');
  });

  it('never fabricates an order when the real API is unavailable, including fixture mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    await expect(createOrderApi(orderRequest, 'test-token')).rejects.toThrow('Không thể kết nối đến máy chủ');
  });

  it('never reports a successful payment when the payment API is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
    await expect(submitPaymentApi({ orderId: 'o1', method: 'E_WALLET', accountRef: 'DEMO-1234' }, 'payment-key', 'token'))
      .rejects.toThrow('Không thể kết nối tới cổng thanh toán');
  });

  it('surfaces server validation errors rather than falling back to a successful payment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ message: ['accountRef should not be empty'] }),
    }));
    await expect(submitPaymentApi({ orderId: 'o1', method: 'E_WALLET' }, 'payment-key', 'token'))
      .rejects.toMatchObject({ status: 400, message: 'accountRef should not be empty' });
  });
});
