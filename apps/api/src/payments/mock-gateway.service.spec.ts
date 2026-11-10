import { PaymentMethod } from '@prisma/client';
import { MockGatewayService } from './mock-gateway.service';

describe('MockGatewayService', () => {
  it('returns success for a valid mock reference', () => {
    const result = new MockGatewayService().charge({
      accountRef: 'demo-1234',
      amount: '45000',
      method: PaymentMethod.E_WALLET,
    });

    expect(result.status).toBe('SUCCESS');
  });

  it('returns failure for references ending in 0000', () => {
    const result = new MockGatewayService().charge({
      accountRef: 'demo-0000',
      amount: '45000',
      method: PaymentMethod.CREDIT_CARD,
    });

    expect(result).toEqual({
      status: 'FAILED',
      message: 'Tài khoản không đủ số dư hoặc giao dịch bị từ chối',
    });
  });
});
