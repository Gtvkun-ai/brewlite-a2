import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderResponse } from '../lib/types';

vi.mock('../lib/orders-api', () => ({
  fetchAllOrders: vi.fn(),
  updateOrderStatusApi: vi.fn(),
  cancelOrderApi: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import {
  fetchAllOrders,
  updateOrderStatusApi,
  cancelOrderApi,
} from '../lib/orders-api';
import AdminOrdersPage from '../app/admin/orders/page';

const mockedFetchAllOrders = vi.mocked(fetchAllOrders);
const mockedUpdateOrderStatusApi = vi.mocked(updateOrderStatusApi);
const mockedCancelOrderApi = vi.mocked(cancelOrderApi);

const sampleOrders: OrderResponse[] = [
  {
    id: 'ord-1',
    code: 'BL-20261116-0001',
    status: 'PAID',
    subTotal: '75000',
    discountAmount: '0',
    totalAmount: '75000',
    deliveryNote: 'Bàn 3, ít ngọt',
    createdAt: '2026-11-16T08:30:00.000Z',
    customerName: 'Nguyen Van An',
    customerPhone: '0901234567',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Cà phê sữa đá',
        quantity: 2,
        unitPrice: '35000',
        selectedSize: 'REGULAR',
        selectedToppings: [],
        itemTotal: '70000',
      },
    ],
  },
  {
    id: 'ord-2',
    code: 'BL-20261116-0002',
    status: 'PREPARING',
    subTotal: '45000',
    discountAmount: '0',
    totalAmount: '45000',
    deliveryNote: 'Nhiều đá',
    createdAt: '2026-11-16T08:35:00.000Z',
    customerName: 'Tran Thi Binh',
    customerPhone: '0987654321',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Trà đào cam sả',
        quantity: 1,
        unitPrice: '45000',
        selectedSize: 'LARGE',
        selectedToppings: ['THACH_DAO'],
        itemTotal: '45000',
      },
    ],
  },
];

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-barista', email: 'barista@brewlite.vn', fullName: 'Barista Hoang', role: 'BARISTA' },
      token: 'valid-barista-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
    });
    mockedFetchAllOrders.mockResolvedValue(sampleOrders);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders KDS dashboard and orders list for BARISTA role', async () => {
    render(<AdminOrdersPage />);

    expect(await screen.findByText('Quản Trị Đơn Hàng & KDS Barista')).toBeInTheDocument();
    expect(screen.getByText('#BL-20261116-0001')).toBeInTheDocument();
    expect(screen.getByText('#BL-20261116-0002')).toBeInTheDocument();
    expect(screen.getByText('Nguyen Van An')).toBeInTheDocument();
    expect(screen.getByText('Bàn 3, ít ngọt')).toBeInTheDocument();
  });

  it('filters orders when clicking a status tab', async () => {
    render(<AdminOrdersPage />);

    expect(await screen.findByText('#BL-20261116-0001')).toBeInTheDocument();

    const preparingFilter = screen.getByTestId('kds-filter-preparing');
    fireEvent.click(preparingFilter);

    // Only ord-2 is PREPARING
    expect(screen.queryByText('#BL-20261116-0001')).not.toBeInTheDocument();
    expect(screen.getByText('#BL-20261116-0002')).toBeInTheDocument();
  });

  it('advances status to PREPARING when clicking "Bắt đầu pha chế"', async () => {
    mockedUpdateOrderStatusApi.mockResolvedValueOnce({
      ...sampleOrders[0],
      status: 'PREPARING',
    });

    render(<AdminOrdersPage />);

    const startBtn = await screen.findByTestId('kds-btn-start-ord-1');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockedUpdateOrderStatusApi).toHaveBeenCalledWith('ord-1', 'PREPARING', 'valid-barista-token');
    });

    expect(await screen.findByText(/Đã chuyển đơn #BL-20261116-0001 sang trạng thái/i)).toBeInTheDocument();
  });

  it('advances status to READY when clicking "Mời khách nhận món"', async () => {
    mockedUpdateOrderStatusApi.mockResolvedValueOnce({
      ...sampleOrders[1],
      status: 'READY',
    });

    render(<AdminOrdersPage />);

    const readyBtn = await screen.findByTestId('kds-btn-ready-ord-2');
    fireEvent.click(readyBtn);

    await waitFor(() => {
      expect(mockedUpdateOrderStatusApi).toHaveBeenCalledWith('ord-2', 'READY', 'valid-barista-token');
    });

    expect(await screen.findByText(/Đã chuyển đơn #BL-20261116-0002 sang trạng thái/i)).toBeInTheDocument();
  });

  it('cancels an order when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedCancelOrderApi.mockResolvedValueOnce({
      ...sampleOrders[0],
      status: 'CANCELLED',
    });

    render(<AdminOrdersPage />);

    const cancelBtn = await screen.findByTestId('kds-btn-cancel-ord-1');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(mockedCancelOrderApi).toHaveBeenCalledWith('ord-1', 'valid-barista-token');
    });

    expect(await screen.findByText(/Đã hủy đơn #BL-20261116-0001/i)).toBeInTheDocument();
  });

  it('shows access guard screen for CUSTOMER role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-cust', email: 'cust@brewlite.vn', role: 'CUSTOMER' },
      token: 'cust-token',
      isAuthenticated: true,
      isLoading: false,
    });

    render(<AdminOrdersPage />);

    expect(screen.getByText('Màn Hình Pha Chế Barista & KDS')).toBeInTheDocument();
    expect(screen.queryByTestId('kds-orders-grid')).not.toBeInTheDocument();
  });
});
