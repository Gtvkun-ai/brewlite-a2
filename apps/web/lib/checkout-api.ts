import { ApiError } from './api';
import type {
  CreateOrderRequest,
  OrderResponse,
  PaymentRequest,
  PaymentResponse,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Creates an order (POST /orders) in PENDING status.
 * Server-authoritative pricing: amount is NOT sent by the client.
 */
export async function createOrderApi(
  request: CreateOrderRequest,
  token: string,
): Promise<OrderResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let errorMsg = `Tạo đơn hàng thất bại (${res.status})`;
      try {
        const body = (await res.json()) as { message?: string | string[]; errorCode?: string };
        if (body.errorCode === 'OUT_OF_STOCK' || body.message?.includes('hết hàng')) {
          errorMsg = 'Một số món trong giỏ hàng hiện đã hết. Vui lòng cập nhật lại giỏ hàng.';
        } else if (body.message) {
          errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {
        // default message
      }
      throw new ApiError(res.status, errorMsg);
    }

    return (await res.json()) as OrderResponse;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false') {
      // Offline/Mock fallback for S1 fixture development
      const orderCode = `BL-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockOrder: OrderResponse = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code: orderCode,
        status: 'PENDING',
        subTotal: '100000',
        discountAmount: '0',
        totalAmount: '100000',
        deliveryNote: request.deliveryNote,
        createdAt: new Date().toISOString(),
        items: request.items.map((it, idx) => ({
          id: `item_${idx}`,
          productId: it.productId,
          productName: 'Đồ uống BrewLite',
          quantity: it.quantity,
          unitPrice: '50000',
          selectedSize: it.selectedSize,
          selectedToppings: it.selectedToppings,
          itemTotal: (50000 * it.quantity).toString(),
        })),
      };
      return mockOrder;
    }
    throw new ApiError(500, 'Không thể kết nối đến máy chủ để tạo đơn hàng.');
  }
}

/**
 * Submits a payment (POST /payments) with an Idempotency-Key.
 * Server-authoritative: amount is NOT sent from the client.
 */
export async function submitPaymentApi(
  request: PaymentRequest,
  idempotencyKey: string,
  token: string,
): Promise<PaymentResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let errorMsg = `Thanh toán thất bại (${res.status})`;
      try {
        const body = (await res.json()) as { message?: string | string[]; errorCode?: string };
        if (body.message) {
          errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {
        // default message
      }
      throw new ApiError(res.status, errorMsg);
    }

    return (await res.json()) as PaymentResponse;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false') {
      // Simulate failure if accountRef equals 'FAIL'
      if (request.accountRef === 'FAIL') {
        return {
          paymentId: `pay_fail_${Date.now()}`,
          orderId: request.orderId,
          status: 'FAILED',
          orderStatus: 'PAYMENT_FAILED',
          amount: '100000',
          method: request.method,
          message: 'Tài khoản không đủ số dư hoặc giao dịch bị từ chối.',
        };
      }
      // Successful mock payment
      return {
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderId: request.orderId,
        status: 'SUCCESS',
        orderStatus: 'PAID',
        amount: '100000',
        method: request.method,
        transactionRef: `TX_${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'Thanh toán thành công qua cổng mô phỏng.',
      };
    }
    throw new ApiError(500, 'Không thể kết nối tới cổng thanh toán.');
  }
}

/**
 * Generates an RFC4122 UUID v4 for the Idempotency-Key.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
