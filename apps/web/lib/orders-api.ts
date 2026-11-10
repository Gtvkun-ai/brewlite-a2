import { ApiError } from './api';
import { getStoredToken } from './auth-api';
import { ORDER_FIXTURES } from './orders-fixtures';
import type { OrderResponse } from './types';

// Cùng biến môi trường với api.ts (không sửa api.ts để tránh conflict).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** true = đang dùng dữ liệu mẫu. Sprint 2: đặt NEXT_PUBLIC_USE_FIXTURES=false. */
export const isUsingFixtures = process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false';

/**
 * Contract: JWT Bearer (api-contracts.md, mục 2.2).
 * Lấy token xác thực từ LocalStorage đã được lưu khi đăng nhập (Owner F).
 */
function getAccessToken(): string | null {
  return getStoredToken();
}

async function request<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to load orders (${res.status})`);
  }
  return (await res.json()) as T;
}

/** GET /orders: lịch sử đơn của user đang đăng nhập, mới nhất trước. */
export async function fetchOrders(): Promise<OrderResponse[]> {
  if (isUsingFixtures) return ORDER_FIXTURES;
  return request<OrderResponse[]>('/orders');
}

/** GET /orders/:id: 401 nếu chưa đăng nhập, 403 (ORDER_ACCESS_DENIED) nếu không phải đơn của mình. */
export async function fetchOrder(id: string): Promise<OrderResponse> {
  if (isUsingFixtures) {
    const found = ORDER_FIXTURES.find((o) => o.id === id);
    if (!found) throw new ApiError(404, 'Order not found');
    return found;
  }
  return request<OrderResponse>(`/orders/${encodeURIComponent(id)}`);
}