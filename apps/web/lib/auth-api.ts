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
    return raw ? (JSON.parse(raw) as AuthResponse['user']) : null;
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

    const data = (await res.json()) as AuthResponse;
    // Normalize response if user object is not nested directly
    const authData: AuthResponse = {
      accessToken: data.accessToken,
      user: data.user || {
        id: 'usr_me',
        email: payload.email,
        fullName: payload.email.split('@')[0],
        role: 'CUSTOMER' as Role,
      },
    };

    setStoredToken(authData.accessToken);
    setStoredUser(authData.user);
    return authData;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // If backend connection fails in fixture / dev mode
    if (process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false') {
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

    const data = (await res.json()) as AuthResponse;
    const authData: AuthResponse = {
      accessToken: data.accessToken,
      user: data.user || {
        id: 'usr_new',
        email: payload.email,
        fullName: payload.fullName,
        role: 'CUSTOMER' as Role,
      },
    };

    setStoredToken(authData.accessToken);
    setStoredUser(authData.user);
    return authData;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (process.env.NEXT_PUBLIC_USE_FIXTURES !== 'false') {
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
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
      }
      return null;
    }

    const user = (await res.json()) as AuthResponse['user'];
    setStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}
