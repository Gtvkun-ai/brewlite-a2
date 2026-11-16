import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Promotion } from '../lib/promotions-api';

vi.mock('../lib/promotions-api', () => ({
  fetchPromotions: vi.fn(),
  createPromotion: vi.fn(),
  updatePromotion: vi.fn(),
  deletePromotion: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../lib/promotions-api';
import AdminPromotionsPage from '../app/admin/promotions/page';

const mockedFetchPromotions = vi.mocked(fetchPromotions);
const mockedCreatePromotion = vi.mocked(createPromotion);
const mockedUpdatePromotion = vi.mocked(updatePromotion);
const mockedDeletePromotion = vi.mocked(deletePromotion);

const samplePromotions: Promotion[] = [
  {
    id: 'p-1',
    code: 'CHAOBANMOI',
    description: 'Giảm 20% cho khách hàng mới',
    type: 'PERCENTAGE',
    value: 20,
    minOrderValue: 40000,
    maxDiscount: 25000,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T23:59:59.000Z',
    isActive: true,
  },
  {
    id: 'p-2',
    code: 'BREWLITE10',
    description: 'Giảm 10.000đ cho đơn từ 60.000đ',
    type: 'FIXED_AMOUNT',
    value: 10000,
    minOrderValue: 60000,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T23:59:59.000Z',
    isActive: false,
  },
];

describe('AdminPromotionsPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-admin', email: 'admin@brewlite.vn', fullName: 'Admin User', role: 'ADMIN' },
      token: 'valid-admin-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
    });
    mockedFetchPromotions.mockResolvedValue(samplePromotions);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders promotions table for ADMIN role', async () => {
    render(<AdminPromotionsPage />);

    expect(await screen.findByText('Quản Trị Mã Giảm Giá & Voucher')).toBeInTheDocument();
    expect(screen.getByText('CHAOBANMOI')).toBeInTheDocument();
    expect(screen.getByText('BREWLITE10')).toBeInTheDocument();
    expect(screen.getByText('Giảm 20% cho khách hàng mới')).toBeInTheDocument();
  });

  it('opens modal when clicking "Tạo mã mới" button', async () => {
    render(<AdminPromotionsPage />);

    const addBtn = await screen.findByTestId('admin-add-promo-btn');
    fireEvent.click(addBtn);

    expect(await screen.findByText('Tạo Mã Khuyến Mãi Mới')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã Voucher/i)).toBeInTheDocument();
  });

  it('creates a new promotion when submitting the form', async () => {
    const newPromo: Promotion = {
      id: 'p-new',
      code: 'SUMMER30',
      description: 'Khuyến mãi hè',
      type: 'PERCENTAGE',
      value: 30,
      minOrderValue: 50000,
      maxDiscount: 35000,
      validFrom: '2026-06-01T00:00:00.000Z',
      validTo: '2026-08-31T23:59:59.000Z',
      isActive: true,
    };
    mockedCreatePromotion.mockResolvedValueOnce(newPromo);

    render(<AdminPromotionsPage />);

    const addBtn = await screen.findByTestId('admin-add-promo-btn');
    fireEvent.click(addBtn);

    fireEvent.change(screen.getByLabelText(/Mã Voucher/i), { target: { value: 'SUMMER30' } });
    fireEvent.change(screen.getByLabelText(/Mô tả ưu đãi/i), { target: { value: 'Khuyến mãi hè' } });

    const submitBtn = screen.getByRole('button', { name: 'Lưu mã khuyến mãi' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedCreatePromotion).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('SUMMER30')).toBeInTheDocument();
  });

  it('toggles promotion active status', async () => {
    mockedUpdatePromotion.mockResolvedValueOnce({
      ...samplePromotions[0],
      isActive: false,
    });

    render(<AdminPromotionsPage />);

    const toggleBtn = await screen.findByText('Đang bật');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockedUpdatePromotion).toHaveBeenCalledWith(
        'p-1',
        { isActive: false },
        'valid-admin-token',
      );
    });
  });

  it('shows access guard screen when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-cust', email: 'cust@brewlite.vn', role: 'CUSTOMER' },
      token: 'cust-token',
      isAuthenticated: true,
      isLoading: false,
    });

    render(<AdminPromotionsPage />);

    expect(screen.getByText('Quản Trị Khuyến Mãi & Voucher')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-add-promo-btn')).not.toBeInTheDocument();
  });
});
