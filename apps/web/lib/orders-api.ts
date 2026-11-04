import { ApiError } from './api';
import { ORDER_FIXTURES } from './orders-fixtures';
import type { Order } from './types';

// Lấy cùng biến môi trường với api.ts (không sửa api.ts để tránh conflict).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** true = đang dùng dữ liệu mẫu. Sprint 2: đặt NEXT_PUBLIC_USE_FIXTURES=false. */
export const isUsingFixtures = process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false';

/**
 * [GIẢ ĐỊNH] FR-04 dùng JWT Bearer. Chỗ lưu token do A quyết định;
 * khi có rồi chỉ cần sửa hàm này.
 */
function getAccessToken(): string | null {
  return null; // TODO: đọc token từ nơi A lưu
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

/** [GIẢ ĐỊNH] GET /orders trả đơn của user đang đăng nhập (đối chiếu C-10). */
export async function fetchOrders(): Promise<Order[]> {
  if (isUsingFixtures) return ORDER_FIXTURES;
  return request<Order[]>('/orders');
}

/** [GIẢ ĐỊNH] GET /orders/:id; đơn không tồn tại hoặc của user khác thì 404/403. */
export async function fetchOrder(id: string): Promise<Order> {
  if (isUsingFixtures) {
    const found = ORDER_FIXTURES.find((o) => o.id === id);
    if (!found) throw new ApiError(404, 'Order not found');
    return found;
  }
  return request<Order>(`/orders/${encodeURIComponent(id)}`);
}