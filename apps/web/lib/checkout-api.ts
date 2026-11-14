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
  idempotencyKey?: string,
): Promise<OrderResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
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
