import {
  cleanup,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/orders-api', () => ({
  fetchAnalytics: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { fetchAnalytics } from '../lib/orders-api';
import AdminDashboardPage from '../app/admin/dashboard/page';

const mockedFetchAnalytics = vi.mocked(fetchAnalytics);

const mockAnalyticsData = {
  totalRevenue: 1250000,
  totalOrders: 25,
  completedOrders: 20,
  cancelledOrders: 2,
  averageOrderValue: 54000,
  statusCounts: {
    PENDING: 1,
    PAID: 2,
    PREPARING: 1,
    READY: 1,
    COMPLETED: 20,
    CANCELLED: 2,
  },
  topProducts: [
    { name: 'Cà phê sữa đá', quantity: 15, revenue: 525000 },
    { name: 'Trà đào cam sả', quantity: 10, revenue: 450000 },
  ],
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-admin', email: 'admin@brewlite.vn', fullName: 'Admin User', role: 'ADMIN' },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
    });
    mockedFetchAnalytics.mockResolvedValue(mockAnalyticsData);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders analytics metrics and top products for ADMIN role', async () => {
    render(<AdminDashboardPage />);

    expect(await screen.findByText('Trung Tâm Điều Hành & Doanh Thu')).toBeInTheDocument();
    expect(screen.getByText('25 đơn')).toBeInTheDocument();
    expect(screen.getByText('Top Món Bán Chạy Nhất')).toBeInTheDocument();
    expect(screen.getByText('Cà phê sữa đá')).toBeInTheDocument();
    expect(screen.getByText('Trà đào cam sả')).toBeInTheDocument();
  });

  it('shows access guard screen when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-cust', email: 'cust@brewlite.vn', role: 'CUSTOMER' },
      token: 'cust-token',
      isAuthenticated: true,
      isLoading: false,
    });

    render(<AdminDashboardPage />);

    expect(screen.getByText('Báo Cáo Doanh Thu Quản Trị')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard-page')).not.toBeInTheDocument();
  });
});
