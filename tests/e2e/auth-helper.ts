import type { APIRequestContext, Page } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'brewlite_access_token'; // khớp apps/web/lib/auth-api.ts (nhánh F)
const USER_KEY = 'brewlite_user';

export async function registerFreshUser(request: APIRequestContext) {
  // Mỗi lần chạy dùng một email mới => dữ liệu test độc lập, không đụng tài khoản seed.
  const email = `e2e.${Date.now()}@brewlite.test`;
  const password = 'E2e-Only-Password1!';
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { email, password, fullName: 'E2E User', phone: '0900000000' },
  });
  if (!res.ok()) throw new Error(`register failed: ${res.status()}`);
  return { email, password };
}

export async function loginViaApi(
  request: APIRequestContext,
  creds: { email: string; password: string },
) {
  const res = await request.post(`${API_URL}/auth/login`, { data: creds });
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`);
  return (await res.json()) as {
    accessToken: string;
    user: { id: string; email: string; fullName: string; role: string };
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