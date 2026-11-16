import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContextType } from '../context/AuthContext';
import type { Product } from '../lib/types';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../lib/api', () => ({
  fetchProducts: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import { createProduct, fetchProducts, updateProduct } from '../lib/api';
import AdminProductsPage from '../app/admin/products/page';

const product: Product = {
  id: 'salt-coffee', code: 'CF-SALT', name: 'Cà phê muối', description: '',
  basePrice: '39000', imageUrl: '/img/caphesua.jpg', category: 'Coffee',
  isAvailable: true, stockQuantity: 10,
};
let auth: AuthContextType;

beforeEach(() => {
  vi.resetAllMocks();
  auth = {
    user: { id: 'admin', email: 'admin@brewlite.vn', fullName: 'Admin', role: 'ADMIN' },
    token: 'admin-token', isAuthenticated: true, isLoading: false,
    login: vi.fn(), logout: vi.fn(), register: vi.fn(), refreshUser: vi.fn(),
  };
  vi.mocked(useAuth).mockImplementation(() => auth);
  vi.mocked(fetchProducts).mockResolvedValue([product]);
});
afterEach(cleanup);

describe('Admin products', () => {
  it('blocks customer access and never loads a fixture catalog before authorization', () => {
    auth = { ...auth, user: { id: 'customer', email: 'customer@test.vn', fullName: 'Customer', role: 'CUSTOMER' } };
    render(<AdminProductsPage />);
    expect(screen.getByRole('heading', { name: /Khu Vực Dành Cho Quản Trị Viên/i })).toBeInTheDocument();
    expect(screen.queryByTestId('admin-products-page')).not.toBeInTheDocument();
    expect(fetchProducts).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Đăng nhập bằng tài khoản khác/ })).toHaveAttribute('href', '/login?redirect=/admin/products');
  });

  it('reports a failed quick admin login on the access screen', async () => {
    auth = { ...auth, user: null, token: null, isAuthenticated: false };
    vi.mocked(auth.login).mockRejectedValue(new Error('Email hoặc mật khẩu không chính xác'));
    render(<AdminProductsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập 1-chạm/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không chính xác');
    expect(fetchProducts).not.toHaveBeenCalled();
  });

  it('disables repeated toggles while pending and uses the API-confirmed product', async () => {
    let resolve: (value: Product) => void = () => {};
    vi.mocked(updateProduct).mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<AdminProductsPage />);
    const toggle = await screen.findByRole('button', { name: 'Tạm hết hàng Cà phê muối' });
    expect(fetchProducts).toHaveBeenCalledWith({ fallbackOnNetworkError: false });
    fireEvent.click(toggle);
    expect(toggle).toBeDisabled();
    expect(updateProduct).toHaveBeenCalledWith('salt-coffee', { isAvailable: false }, 'admin-token');
    resolve({ ...product, isAvailable: false, stockQuantity: 7 });
    expect(await screen.findByRole('button', { name: 'Bật bán Cà phê muối' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('7 ly')).toBeInTheDocument();
  });

  it('keeps the previous availability when the server rejects an update', async () => {
    vi.mocked(updateProduct).mockRejectedValue(new Error('Phiên đăng nhập hết hạn'));
    render(<AdminProductsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tạm hết hàng Cà phê muối' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Phiên đăng nhập hết hạn');
    expect(screen.getByRole('button', { name: 'Tạm hết hàng Cà phê muối' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('creates zero-stock products with zero inventory and keeps API errors inside the dialog', async () => {
    vi.mocked(createProduct).mockRejectedValueOnce(new Error('Mã sản phẩm đã tồn tại'));
    render(<AdminProductsPage />);
    await screen.findByText('Cà phê muối');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm món mới' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(screen.getByLabelText('Tên món đồ uống / bánh *'), { target: { value: 'Trà thử nghiệm' } });
    const price = screen.getByLabelText(/Giá bán gốc/) as HTMLInputElement;
    fireEvent.change(price, { target: { value: '42000' } });
    expect(price.checkValidity()).toBe(true);
    fireEvent.change(screen.getByLabelText('Số lượng tồn kho ban đầu'), { target: { value: '0' } });
    fireEvent.submit(dialog.querySelector('form')!);
    await waitFor(() => expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ stockQuantity: 0 }), 'admin-token'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mã sản phẩm đã tồn tại');
    expect(dialog).toContainElement(screen.getByRole('alert'));
  });

  it('shows a retryable real API error instead of sample admin products', async () => {
    vi.mocked(fetchProducts).mockRejectedValueOnce(new Error('network down'));
    render(<AdminProductsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách sản phẩm');
    expect(screen.queryByText('Cà phê muối')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Cà phê muối')).toBeInTheDocument();
  });
});
