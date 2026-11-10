import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import LoginPage from '../app/login/page';
import RegisterPage from '../app/register/page';
import * as authApi from '../lib/auth-api';
import { ApiError } from '../lib/api';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirect' ? '/checkout' : null),
  }),
  usePathname: () => '/',
}));

describe('Authentication & Navbar (Role F - S1/S2)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe('Navbar Component', () => {
    function NavbarWrapper() {
      return (
        <AuthProvider>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthProvider>
      );
    }

    it('renders login and register links when unauthenticated', () => {
      render(<NavbarWrapper />);
      expect(screen.getByTestId('login-link')).toBeInTheDocument();
      expect(screen.getByTestId('register-link')).toBeInTheDocument();
      expect(screen.getByTestId('cart-badge')).toHaveTextContent('0');
    });

    it('displays user info and logout button when authenticated', async () => {
      localStorage.setItem('brewlite_access_token', 'jwt-token-123');
      localStorage.setItem(
        'brewlite_user',
        JSON.stringify({
          id: 'u1',
          email: 'test@brewlite.vn',
          fullName: 'Nguyễn Văn An',
          role: 'CUSTOMER',
        }),
      );

      render(<NavbarWrapper />);

      expect(await screen.findByTestId('user-info')).toBeInTheDocument();
      expect(screen.getByText(/Nguyễn Văn An/i)).toBeInTheDocument();

      const logoutBtn = screen.getByTestId('logout-btn');
      expect(logoutBtn).toBeInTheDocument();

      fireEvent.click(logoutBtn);

      // After logout, user-info should disappear and login-link should appear
      await waitFor(() => {
        expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
        expect(screen.getByTestId('login-link')).toBeInTheDocument();
      });
      expect(localStorage.getItem('brewlite_access_token')).toBeNull();
    });

    it('updates cart badge count correctly when cart has items', () => {
      function CartUpdater() {
        const { addItem } = useCart();
        return (
          <button
            onClick={() =>
              addItem({
                productId: 'p1',
                name: 'Espresso',
                basePrice: '30000',
                size: 'REGULAR',
                toppings: [],
                quantity: 3,
                unitPrice: '30000',
                itemTotal: '90000',
              })
            }
            data-testid="add-btn"
          >
            Add
          </button>
        );
      }

      render(
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartUpdater />
          </CartProvider>
        </AuthProvider>,
      );

      expect(screen.getByTestId('cart-badge')).toHaveTextContent('0');
      fireEvent.click(screen.getByTestId('add-btn'));
      expect(screen.getByTestId('cart-badge')).toHaveTextContent('3');
    });
  });

  describe('LoginPage', () => {
    function LoginWrapper() {
      return (
        <AuthProvider>
          <CartProvider>
            <LoginPage />
          </CartProvider>
        </AuthProvider>
      );
    }

    it('validates required email and password fields', async () => {
      render(<LoginWrapper />);

      fireEvent.click(screen.getByTestId('login-submit'));

      expect(await screen.findByTestId('email-error')).toHaveTextContent(
        'Vui lòng nhập địa chỉ email',
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Vui lòng nhập mật khẩu',
      );
    });

    it('validates email format and minimum password length', async () => {
      render(<LoginWrapper />);

      fireEvent.change(screen.getByTestId('login-email'), {
        target: { value: 'not-an-email' },
      });
      fireEvent.change(screen.getByTestId('login-password'), {
        target: { value: '123' },
      });
      fireEvent.click(screen.getByTestId('login-submit'));

      expect(await screen.findByTestId('email-error')).toHaveTextContent(
        'Email không đúng định dạng',
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Mật khẩu phải có ít nhất 8 ký tự',
      );
    });

    it('displays error banner on 401 Unauthorized', async () => {
      vi.spyOn(authApi, 'loginApi').mockRejectedValueOnce(
        new ApiError(401, 'Email hoặc mật khẩu không chính xác.'),
      );

      render(<LoginWrapper />);

      fireEvent.change(screen.getByTestId('login-email'), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByTestId('login-password'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByTestId('login-submit'));

      expect(await screen.findByTestId('login-error')).toHaveTextContent(
        'Email hoặc mật khẩu không chính xác',
      );
    });

    it('successfully logs in and redirects to checkout', async () => {
      vi.spyOn(authApi, 'loginApi').mockResolvedValueOnce({
        accessToken: 'valid-jwt-token',
        user: {
          id: 'u123',
          email: 'valid@brewlite.vn',
          fullName: 'Trần Thị Bình',
          role: 'CUSTOMER',
        },
      });

      render(<LoginWrapper />);

      fireEvent.change(screen.getByTestId('login-email'), {
        target: { value: 'valid@brewlite.vn' },
      });
      fireEvent.change(screen.getByTestId('login-password'), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByTestId('login-submit'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });
    });
  });

  describe('RegisterPage', () => {
    function RegisterWrapper() {
      return (
        <AuthProvider>
          <CartProvider>
            <RegisterPage />
          </CartProvider>
        </AuthProvider>
      );
    }

    it('validates register fields and rejects missing input', async () => {
      render(<RegisterWrapper />);

      fireEvent.click(screen.getByTestId('register-submit'));

      expect(await screen.findByTestId('fullname-error')).toHaveTextContent(
        'Vui lòng nhập họ và tên của bạn',
      );
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Vui lòng nhập địa chỉ email',
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Vui lòng nhập mật khẩu',
      );
    });

    it('handles 409 conflict when email already exists', async () => {
      vi.spyOn(authApi, 'registerApi').mockRejectedValueOnce(
        new ApiError(409, 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'),
      );

      render(<RegisterWrapper />);

      fireEvent.change(screen.getByTestId('register-fullname'), {
        target: { value: 'Lê Văn Cường' },
      });
      fireEvent.change(screen.getByTestId('register-email'), {
        target: { value: 'existing@brewlite.vn' },
      });
      fireEvent.change(screen.getByTestId('register-password'), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.click(screen.getByTestId('register-submit'));

      expect(await screen.findByTestId('register-error')).toHaveTextContent(
        'Email này đã được sử dụng',
      );
    });

    it('successfully registers and redirects', async () => {
      vi.spyOn(authApi, 'registerApi').mockResolvedValueOnce({
        accessToken: 'registered-jwt',
        user: {
          id: 'u_new',
          email: 'newbie@brewlite.vn',
          fullName: 'Lê Văn Cường',
          role: 'CUSTOMER',
        },
      });

      render(<RegisterWrapper />);

      fireEvent.change(screen.getByTestId('register-fullname'), {
        target: { value: 'Lê Văn Cường' },
      });
      fireEvent.change(screen.getByTestId('register-email'), {
        target: { value: 'newbie@brewlite.vn' },
      });
      fireEvent.change(screen.getByTestId('register-password'), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.click(screen.getByTestId('register-submit'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });
    });
  });
});
