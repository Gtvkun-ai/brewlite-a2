import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

export type MockGatewayResult =
  | { status: 'SUCCESS'; transactionRef: string }
  | { status: 'FAILED'; message: string };

@Injectable()
export class MockGatewayService {
  charge(input: {
    accountRef: string;
    amount: string;
    method: PaymentMethod;
  }): MockGatewayResult {
    if (input.accountRef.endsWith('0000')) {
      return {
        status: 'FAILED',
        message: 'Tài khoản không đủ số dư hoặc giao dịch bị từ chối',
      };
    }

    return {
      status: 'SUCCESS',
      transactionRef: `MOCK-${Date.now()}-${input.method}`,
    };
  }
}
