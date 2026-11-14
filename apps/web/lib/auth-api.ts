import { ApiError } from './api';
import type { AuthResponse, Role } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TOKEN_KEY = 'brewlite_access_token';
const USER_KEY = 'brewlite_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage errors (e.g. private browsing quota)
  }
}

export function getStoredUser(): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthResponse['user'] | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function clearAuth(): void {
  setStoredToken(null);
  setStoredUser(null);
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const ROLES: Role[] = ['CUSTOMER', 'BARISTA', 'MANAGER', 'ADMIN'];

/** Support both the API's verified JWT profile and nested user responses. */
function normalizeProfile(value: unknown, fullName?: string): AuthResponse['user'] | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Record<string, unknown>;
  const id = profile.id ?? profile.userId;
  if (
    typeof id !== 'string' || !id ||
    typeof profile.email !== 'string' || !profile.email ||
    !ROLES.includes(profile.role as Role)
  ) return null;
  return {
    id,
    email: profile.email,
    fullName: typeof profile.fullName === 'string' && profile.fullName.trim()
      ? profile.fullName
      : fullName || profile.email.split('@')[0],
    role: profile.role as Role,
  };
}

async function readProfile(token: string, fullName?: string): Promise<AuthResponse['user']> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, 'Không thể xác minh tài khoản đăng nhập.');
  const user = normalizeProfile(await res.json(), fullName);
  if (!user) throw new ApiError(502, 'Máy chủ trả về thông tin tài khoản không hợp lệ.');
  return user;
}

async function resolveAuthResponse(value: unknown, fullName?: string): Promise<AuthResponse> {
  if (!value || typeof value !== 'object' || !('accessToken' in value) ||
      typeof value.accessToken !== 'string' || !value.accessToken.trim()) {
    throw new ApiError(502, 'Máy chủ không trả về token đăng nhập hợp lệ.');
  }
  const nestedUser = 'user' in value ? normalizeProfile(value.user, fullName) : null;
  // The current NestJS contract returns only accessToken. Resolve the verified
  // role through /auth/me instead of inventing a CUSTOMER user or decoding JWT.
  const user = nestedUser ?? await readProfile(value.accessToken, fullName);
  return { accessToken: value.accessToken, user };
}

/**
 * Fallback mock authentication for offline/fixture mode when backend is unreachable.
 */
function mockAuthResponse(email: string, fullName?: string): AuthResponse {
  const name = fullName || email.split('@')[0] || 'Khách hàng';
  return {
    accessToken: `mock-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    user: {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      fullName: name,
      role: 'CUSTOMER' as Role,
    },
  };
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = 'Sai thông tin đăng nhập hoặc mật khẩu';
      try {
        const body = (await res.json()) as { message?: string | string[] };
        if (body.message) {
          errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {
        // use default message
      }
      throw new ApiError(res.status, errorMsg);
    }

    const authData = await resolveAuthResponse(await res.json());

    setStoredToken(authData.accessToken);
    setStoredUser(authData.user);
    return authData;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // If backend connection fails in fixture / dev mode
    if (process.env.NEXT_PUBLIC_USE_FIXTURES === 'true') {
      const mockData = mockAuthResponse(payload.email);
      setStoredToken(mockData.accessToken);
      setStoredUser(mockData.user);
      return mockData;
    }
    throw new ApiError(500, 'Không thể kết nối đến máy chủ xác thực.');
  }
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = 'Đăng ký tài khoản không thành công';
      if (res.status === 409) {
        errorMsg = 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.';
      } else {
        try {
          const body = (await res.json()) as { message?: string | string[] };
          if (body.message) {
            errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
          }
        } catch {
          // use default message
        }
      }
      throw new ApiError(res.status, errorMsg);
    }

    const authData = await resolveAuthResponse(await res.json(), payload.fullName);

    setStoredToken(authData.accessToken);
    setStoredUser(authData.user);
    return authData;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (process.env.NEXT_PUBLIC_USE_FIXTURES === 'true') {
      const mockData = mockAuthResponse(payload.email, payload.fullName);
      setStoredToken(mockData.accessToken);
      setStoredUser(mockData.user);
      return mockData;
    }
    throw new ApiError(500, 'Không thể kết nối đến máy chủ xác thực.');
  }
}

export async function fetchMeApi(): Promise<AuthResponse['user'] | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const user = await readProfile(token, getStoredUser()?.fullName);
    if (getStoredToken() !== token) return null;
    setStoredUser(user);
    return user;
  } catch (error) {
    if (getStoredToken() !== token) return null;
    if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 502)) {
      clearAuth();
      return null;
    }
    return getStoredUser();
  }
}
