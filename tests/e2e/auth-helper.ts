import type { APIRequestContext, Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'brewlite_access_token'; // khớp apps/web/lib/auth-api.ts (nhánh F)
const USER_KEY = 'brewlite_user';

export async function registerFreshUser(request: APIRequestContext) {
  // Mỗi lần chạy dùng một email mới => dữ liệu test độc lập, không đụng tài khoản seed.
  const email = `e2e.${Date.now()}@brewlite.test`;
  const password = `E2e-${randomBytes(18).toString('base64url')}!`;
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { email, password, fullName: 'E2E User', phone: '0900000000' },
  });
  if (!res.ok()) throw new Error(`register failed: ${res.status()}`);
  return { email, password, fullName: 'E2E User' };
}

export async function loginViaApi(
  request: APIRequestContext,
  creds: { email: string; password: string; fullName?: string },
) {
  const res = await request.post(`${API_URL}/auth/login`, { data: creds });
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`);
  const { accessToken } = (await res.json()) as { accessToken: string };

  const profile = await request.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profile.ok()) throw new Error(`authenticated profile failed: ${profile.status()}`);
  const authenticatedUser = (await profile.json()) as {
    userId: string;
    email: string;
    role: string;
  };

  return {
    accessToken,
    user: {
      id: authenticatedUser.userId,
      email: authenticatedUser.email,
      fullName: creds.fullName ?? creds.email.split('@')[0],
      role: authenticatedUser.role,
    },
  };
}

// Đặt token vào localStorage TRƯỚC khi trang tải (không phải qua form đăng nhập).
export async function signIn(page: Page, auth: Awaited<ReturnType<typeof loginViaApi>>) {
  await page.addInitScript(
    ([tokenKey, userKey, token, user]) => {
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, user);
    },
    [TOKEN_KEY, USER_KEY, auth.accessToken, JSON.stringify(auth.user)] as const,
  );
}
