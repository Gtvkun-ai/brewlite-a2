import { ApiError } from './api';
import { getStoredToken } from './auth-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Promotion {
  id: string;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string | number;
  minOrderValue: string | number;
  maxDiscount?: string | number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface CreatePromotionInput {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}

export interface UpdatePromotionInput {
  description?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

const FALLBACK_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    code: 'CHAOBANMOI',
    description: 'Giảm 20% cho đơn hàng đầu tiên trải nghiệm BrewLite',
    type: 'PERCENTAGE',
    value: 20,
    minOrderValue: 40000,
    maxDiscount: 25000,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T23:59:59.000Z',
    isActive: true,
  },
  {
    id: 'promo-2',
    code: 'BREWLITE10',
    description: 'Giảm 10.000đ cho đơn hàng từ 60.000đ',
    type: 'FIXED_AMOUNT',
    value: 10000,
    minOrderValue: 60000,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T23:59:59.000Z',
    isActive: true,
  },
];

async function promoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = `Yêu cầu thất bại (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export async function fetchPromotions(activeOnly = false, token?: string): Promise<Promotion[]> {
  const path = activeOnly ? '/promotions' : '/promotions/admin/all';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await promoRequest<Promotion[]>(path, { headers });
  } catch (err) {
    if (process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false') {
      return activeOnly ? FALLBACK_PROMOTIONS.filter((p) => p.isActive) : FALLBACK_PROMOTIONS;
    }
    throw err;
  }
}

export async function createPromotion(dto: CreatePromotionInput, token: string): Promise<Promotion> {
  return promoRequest<Promotion>('/promotions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(dto),
  });
}

export async function updatePromotion(
  id: string,
  dto: UpdatePromotionInput,
  token: string,
): Promise<Promotion> {
  return promoRequest<Promotion>(`/promotions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(dto),
  });
}

export async function deletePromotion(id: string, token: string): Promise<Promotion> {
  return promoRequest<Promotion>(`/promotions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
