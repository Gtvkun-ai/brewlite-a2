import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../lib/types';

// Mock the API client so no live API is needed.
vi.mock('../lib/api', () => ({
  fetchProducts: vi.fn(),
}));

import { fetchProducts } from '../lib/api';
import MenuPage from '../app/page';

const mockedFetchProducts = vi.mocked(fetchProducts);

const sampleProducts: Product[] = [
  {
    id: 'p1',
    code: 'ESP-001',
    name: 'Classic Espresso',
    description: 'A bold single shot.',
    basePrice: '2.50',
    imageUrl: 'https://images.brewlite.local/espresso.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 120,
  },
  {
    id: 'p2',
    code: 'LAT-001',
    name: 'Vanilla Latte',
    description: 'Smooth and sweet.',
    basePrice: '4.25',
    imageUrl: 'https://images.brewlite.local/vanilla-latte.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 90,
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MenuPage', () => {
  it('renders products on successful fetch', async () => {
    mockedFetchProducts.mockResolvedValueOnce(sampleProducts);

    render(<MenuPage />);

    expect(await screen.findByText('Classic Espresso')).toBeInTheDocument();
    expect(screen.getByText('Vanilla Latte')).toBeInTheDocument();
  });

  it('shows the Loading state before the fetch resolves', async () => {
    let resolve: ((value: Product[]) => void) | undefined;
    mockedFetchProducts.mockReturnValueOnce(
      new Promise<Product[]>((r) => {
        resolve = r;
      }),
    );

    render(<MenuPage />);

    expect(screen.getByText('Loading menu…')).toBeInTheDocument();

    resolve?.(sampleProducts);
    expect(await screen.findByText('Classic Espresso')).toBeInTheDocument();
  });

  it('shows the Empty state when the list is empty', async () => {
    mockedFetchProducts.mockResolvedValueOnce([]);

    render(<MenuPage />);

    expect(await screen.findByText('Menu is empty')).toBeInTheDocument();
  });

  it('shows the Error state with a working Retry on failure', async () => {
    mockedFetchProducts.mockRejectedValueOnce(new Error('network down'));

    render(<MenuPage />);

    const retry = await screen.findByRole('button', { name: /retry/i });
    expect(retry).toBeInTheDocument();

    // Retry re-invokes the fetch; this time it succeeds.
    mockedFetchProducts.mockResolvedValueOnce(sampleProducts);
    fireEvent.click(retry);

    expect(await screen.findByText('Classic Espresso')).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchProducts).toHaveBeenCalledTimes(2));
  });
});
