import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { fetchMeApi, getStoredUser, loginApi, registerApi } from '../lib/auth-api';

const adminProfile = { userId: 'admin-db-id', email: 'admin@brewlite.vn', role: 'ADMIN' };
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'false');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function AuthState() {
  const auth = useAuth();
  return <>
    <div data-testid="auth-state">{JSON.stringify({ user: auth.user, authenticated: auth.isAuthenticated, loading: auth.isLoading })}</div>
    <button onClick={auth.logout}>Logout</button>
  </>;
}

describe('Real NestJS authentication contract', () => {
  it('resolves token-only admin login through /auth/me and keeps the verified ADMIN role', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({ accessToken: 'verified-admin-token' }))
      .mockResolvedValueOnce(response(adminProfile));
    vi.stubGlobal('fetch', fetcher);
    const auth = await loginApi({ email: adminProfile.email, password: 'Password123!' });
    expect(auth).toEqual({
      accessToken: 'verified-admin-token',
      user: { id: 'admin-db-id', email: adminProfile.email, fullName: 'admin', role: 'ADMIN' },
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, expect.stringContaining('/auth/me'), expect.objectContaining({
      headers: { Authorization: 'Bearer verified-admin-token' },
    }));
    expect(getStoredUser()).toEqual(auth.user);
  });

  it('normalizes userId on reload and preserves the stored display name', async () => {
    localStorage.setItem('brewlite_access_token', 'valid-token');
    localStorage.setItem('brewlite_user', JSON.stringify({ id: 'admin-db-id', email: adminProfile.email, fullName: 'Quản trị viên', role: 'ADMIN' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(adminProfile)));
    await expect(fetchMeApi()).resolves.toEqual({ id: 'admin-db-id', email: adminProfile.email, fullName: 'Quản trị viên', role: 'ADMIN' });
    expect(getStoredUser()?.id).toBe('admin-db-id');
  });

  it('uses the registered full name with the verified token-only registration profile', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({ accessToken: 'new-customer-token' }))
      .mockResolvedValueOnce(response({ userId: 'customer-db-id', email: 'new@test.vn', role: 'CUSTOMER' }));
    vi.stubGlobal('fetch', fetcher);
    const auth = await registerApi({ email: 'new@test.vn', fullName: 'Khách mới', password: 'Password123!' });
    expect(auth.user).toEqual({ id: 'customer-db-id', email: 'new@test.vn', fullName: 'Khách mới', role: 'CUSTOMER' });
  });

  it('rejects an invalid verified profile instead of fabricating a customer', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ accessToken: 'candidate-token' }))
      .mockResolvedValueOnce(response({ email: adminProfile.email, role: 'ADMIN' })));
    await expect(loginApi({ email: adminProfile.email, password: 'Password123!' })).rejects.toMatchObject({ status: 502 });
    expect(localStorage.getItem('brewlite_access_token')).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('does not synthesize auth when a successful response is missing its token, even with fixtures enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({})));
    await expect(loginApi({ email: adminProfile.email, password: 'Password123!' })).rejects.toMatchObject({ status: 502 });
    expect(localStorage.getItem('brewlite_access_token')).toBeNull();
  });

  it('clears both persisted and in-memory auth when profile revalidation returns 401', async () => {
    localStorage.setItem('brewlite_access_token', 'expired-token');
    localStorage.setItem('brewlite_user', JSON.stringify({ id: 'admin-db-id', email: adminProfile.email, fullName: 'Admin', role: 'ADMIN' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Unauthorized' }, 401)));
    render(<AuthProvider><AuthState /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('"loading":false'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"user":null');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"authenticated":false');
    expect(localStorage.getItem('brewlite_access_token')).toBeNull();
  });

  it('keeps logout effective when an older profile request finishes later', async () => {
    localStorage.setItem('brewlite_access_token', 'old-token');
    localStorage.setItem('brewlite_user', JSON.stringify({ id: 'admin-db-id', email: adminProfile.email, fullName: 'Admin', role: 'ADMIN' }));
    let resolve: (value: ReturnType<typeof response>) => void = () => {};
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((done) => { resolve = done; })));
    render(<AuthProvider><AuthState /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    resolve(response(adminProfile));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('"authenticated":false'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"user":null');
    expect(getStoredUser()).toBeNull();
  });
});
