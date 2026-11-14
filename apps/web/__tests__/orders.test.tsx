import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OrderResponse } from '../lib/types';

// Mock chỉ client orders; ApiError vẫn lấy từ ../lib/api thật.
vi.mock('../lib/orders-api', () => ({
  fetchOrders: vi.fn(),
  fetchOrder: vi.fn(),
  isUsingFixtures: false,
}));

import { ApiError } from '../lib/api';
import { formatVnd } from '../lib/format';
import { fetchOrders } from '../lib/orders-api';
import OrdersPage from '../app/orders/page';

const mockedFetchOrders = vi.mocked(fetchOrders);

const sampleOrders: OrderResponse[] = [
  {
    id: 'o1',
    code: 'BL-20261106-001',
    status: 'PREPARING',
    subTotal: '100000',
    discountAmount: '0',
    totalAmount: '100000',
    createdAt: '2026-11-06T01:15:00.000Z',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        productName: 'Classic Espresso',
        quantity: 2,
        unitPrice: '50000',
        selectedSize: 'LARGE',
        selectedToppings: ['TRAN_CHAU'],
        itemTotal: '100000',
      },
    ],
  },
  {
    id: 'o2',
    code: 'BL-20261105-001',
    status: 'COMPLETED',
    subTotal: '45000',
    discountAmount: '0',
    totalAmount: '45000',
    createdAt: '2026-11-05T07:02:00.000Z',
    items: [],
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OrdersPage', () => {
  it('renders order history with code, status and total (FR-06)', async () => {
    mockedFetchOrders.mockResolvedValueOnce(sampleOrders);
    render(<OrdersPage />);

    expect(await screen.findByText('#BL-20261106-001')).toBeInTheDocument();
    expect(screen.getByText('#BL-20261105-001')).toBeInTheDocument();
    expect(screen.getByText('Đang pha chế')).toBeInTheDocument();
    expect(screen.getByText('Đã hoàn tất')).toBeInTheDocument();
    // expect(screen.getByText(formatVnd('100000'))).toBeInTheDocument();
    expect(screen.getByText('100.000 ₫')).toBeInTheDocument();
  });

  it('shows the Loading state before the fetch resolves (NFR-03)', async () => {
    let resolve: ((v: OrderResponse[]) => void) | undefined;
    mockedFetchOrders.mockReturnValueOnce(
      new Promise<OrderResponse[]>((r) => {
        resolve = r;
      }),
    );
    render(<OrdersPage />);

    expect(screen.getByText('Loading orders…')).toBeInTheDocument();

    resolve?.(sampleOrders);
    expect(await screen.findByText('#BL-20261106-001')).toBeInTheDocument();
  });

  it('shows the Empty state when there are no orders (NFR-03)', async () => {
    mockedFetchOrders.mockResolvedValueOnce([]);
    render(<OrdersPage />);

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
  });

  it('shows the Error state with a working Retry (NFR-03)', async () => {
    mockedFetchOrders.mockRejectedValueOnce(new Error('network down'));
    render(<OrdersPage />);

    const retry = await screen.findByRole('button', { name: /retry/i });
    mockedFetchOrders.mockResolvedValueOnce(sampleOrders);
    fireEvent.click(retry);

    expect(await screen.findByText('#BL-20261106-001')).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchOrders).toHaveBeenCalledTimes(2));
  });

  it('asks the user to sign in on 401 and shows no orders (NFR-02)', async () => {
    mockedFetchOrders.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    render(<OrdersPage />);

    expect(
      await screen.findByText('Please sign in to view your orders.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('#BL-20261106-001')).not.toBeInTheDocument();
  });
});