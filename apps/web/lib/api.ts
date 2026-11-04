import type { Product } from './types';

/**
 * Base URL of the BrewLite API. Read from NEXT_PUBLIC_API_URL so the value is
 * available in the browser (all catalog fetches are client-side), defaulting to
 * the local API per the .env contract.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Error carrying the HTTP status so callers can distinguish 404 from failures. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Fetch the full product catalog via GET /products. */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to load products (${res.status})`);
  }
  return (await res.json()) as Product[];
}

/** Fetch a single product via GET /products/:id. */
export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to load product (${res.status})`);
  }
  return (await res.json()) as Product;
}
