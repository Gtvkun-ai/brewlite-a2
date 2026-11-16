import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../app/profile/page';
import * as AuthContextModule from '../context/AuthContext';
import * as authApiModule from '../lib/auth-api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('ProfilePage Component (Quản lý tài khoản khách hàng)', () => {
  const mockUser = {
    id: 'user-cust-1',
    email: 'khachhang@brewlite.vn',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    address: '123 Nguyen Hue, TP.HCM',
    role: 'CUSTOMER' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị lời nhắc đăng nhập khi người dùng chưa đăng nhập', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    });

    render(<ProfilePage />);

    expect(screen.getByText('Tài khoản thành viên')).toBeInTheDocument();
    expect(
      screen.getByText(/Vui lòng đăng nhập để xem thông tin cá nhân/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('profile-login-btn')).toBeInTheDocument();
  });

  it('hiển thị đầy đủ thông tin cá nhân khi đã đăng nhập', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    });

    render(<ProfilePage />);

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Nguyen Van A');
    expect(screen.getByText('khachhang@brewlite.vn')).toBeInTheDocument();
    expect(screen.getByText('Thành viên thân thiết')).toBeInTheDocument();
    expect(screen.getByTestId('profile-fullname-input')).toHaveValue('Nguyen Van A');
    expect(screen.getByTestId('profile-phone-input')).toHaveValue('0901234567');
    expect(screen.getByTestId('profile-address-input')).toHaveValue('123 Nguyen Hue, TP.HCM');
  });

  it('cho phép cập nhật họ tên, số điện thoại và địa chỉ nhận hàng', async () => {
    const updateProfileMock = vi.fn().mockResolvedValue({
      ...mockUser,
      fullName: 'Nguyen Van Updated',
      phone: '0988776655',
      address: '456 Le Loi, Quan 1',
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: updateProfileMock,
      changePassword: vi.fn(),
    });

    render(<ProfilePage />);

    const nameInput = screen.getByTestId('profile-fullname-input');
    const phoneInput = screen.getByTestId('profile-phone-input');
    const addressInput = screen.getByTestId('profile-address-input');
    const saveBtn = screen.getByTestId('save-profile-btn');

    fireEvent.change(nameInput, { target: { value: 'Nguyen Van Updated' } });
    fireEvent.change(phoneInput, { target: { value: '0988776655' } });
    fireEvent.change(addressInput, { target: { value: '456 Le Loi, Quan 1' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        fullName: 'Nguyen Van Updated',
        phone: '0988776655',
        address: '456 Le Loi, Quan 1',
      });
      expect(screen.getByTestId('profile-success-msg')).toHaveTextContent(
        'Cập nhật thông tin tài khoản thành công!',
      );
    });
  });

  it('báo lỗi khi mật khẩu mới và xác nhận mật khẩu không khớp', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    });

    render(<ProfilePage />);

    // Chuyển sang Tab Mật khẩu
    const tabPassword = screen.getByTestId('tab-password');
    fireEvent.click(tabPassword);

    const currentPwdInput = screen.getByTestId('current-password-input');
    const newPwdInput = screen.getByTestId('new-password-input');
    const confirmPwdInput = screen.getByTestId('confirm-password-input');
    const changePwdBtn = screen.getByTestId('change-password-btn');

    fireEvent.change(currentPwdInput, { target: { value: 'CurrentPass123!' } });
    fireEvent.change(newPwdInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'MismatchedPassword123!' } });
    fireEvent.click(changePwdBtn);

    await waitFor(() => {
      expect(screen.getByTestId('password-error-msg')).toHaveTextContent(
        'Xác nhận mật khẩu mới không trùng khớp.',
      );
    });
  });
});
