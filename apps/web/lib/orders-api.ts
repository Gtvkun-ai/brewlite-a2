import { ApiError } from './api';
import { getStoredToken } from './auth-api';
import { ORDER_FIXTURES } from './orders-fixtures';
import type { OrderResponse, OrderStatus } from './types';

// Cùng biến môi trường với api.ts (không sửa api.ts để tránh conflict).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** true = đang dùng dữ liệu mẫu. Sprint 2: đặt NEXT_PUBLIC_USE_FIXTURES=false. */
export const isUsingFixtures = process.env.NEXT_PUBLIC_USE_FIXTURES === 'true';

/**
 * Contract: JWT Bearer (api-contracts.md, mục 2.2).
 * Lấy token xác thực từ LocalStorage đã được lưu khi đăng nhập (Owner F).
 */
function getAccessToken(): string | null {
  return getStoredToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
    headers,
  });
  if (!res.ok) {
    let errorMsg = `Failed to load orders (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(res.status, errorMsg);
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

/** Admin/Staff: GET /orders/admin/all: lấy toàn bộ đơn hàng của hệ thống có phân loại */
export async function fetchAllOrders(status?: OrderStatus, token?: string): Promise<OrderResponse[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    return await request<OrderResponse[]>(`/orders/admin/all${query}`, { headers });
  } catch (err) {
    // If using fixtures or backend offline, fallback gracefully
    if (isUsingFixtures) {
      if (status) {
        return ORDER_FIXTURES.filter((o) => o.status === status);
      }
      return ORDER_FIXTURES;
    }
    throw err;
  }
}
/** Admin/Staff: PATCH /orders/:id/status: cập nhật trạng thái đơn (KDS / Barista action) */
export async function updateOrderStatusApi(
  orderId: string,
  status: OrderStatus,
  token?: string,
): Promise<OrderResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
}

/** Customer/Admin: PATCH /orders/:id/cancel: Hủy đơn hàng và hoàn tiền/hoàn kho */
export async function cancelOrderApi(orderId: string, token?: string): Promise<OrderResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'PATCH',
    headers,
  });
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  statusCounts: Record<string, number>;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

/** Admin/Manager: GET /orders/admin/analytics: Lấy báo cáo thống kê doanh thu và món bán chạy */
export async function fetchAnalytics(token?: string): Promise<AnalyticsData> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    return await request<AnalyticsData>('/orders/admin/analytics', { headers });
  } catch (err) {
    if (isUsingFixtures) {
      return {
        totalRevenue: 350000,
        totalOrders: 6,
        completedOrders: 3,
        cancelledOrders: 1,
        averageOrderValue: 70000,
        statusCounts: {
          PENDING: 1,
          PAID: 1,
          PREPARING: 1,
          READY: 0,
          COMPLETED: 3,
          CANCELLED: 1,
        },
        topProducts: [
          { name: 'Cà phê sữa đá', quantity: 5, revenue: 175000 },
          { name: 'Trà đào cam sả', quantity: 3, revenue: 135000 },
          { name: 'Matcha Latte', quantity: 1, revenue: 45000 },
        ],
      };
    }
    throw err;
  }
}
