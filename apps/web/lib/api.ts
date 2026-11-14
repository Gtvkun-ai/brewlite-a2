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

/** Fallback sample products for offline/fixture mode when backend API is offline. */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-salt-coffee',
    code: 'CF-SALT',
    name: 'Cà phê muối',
    description: 'Cà phê rang mộc đậm đà kết hợp lớp kem muối béo mịn.',
    basePrice: '39000',
    imageUrl: '/img/caphesua.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 100,
  },
  {
    id: 'prod-milk-coffee',
    code: 'CF-MILK',
    name: 'Cà phê sữa đá',
    description: 'Cà phê Robusta đậm đà pha phin truyền thống kết hợp sữa đặc ngọt béo.',
    basePrice: '35000',
    imageUrl: '/img/caphesua.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 100,
  },
  {
    id: 'prod-americano',
    code: 'CF-AME',
    name: 'Americano đá',
    description: 'Espresso nguyên chất pha loãng với nước tinh khiết, vị đắng thanh dịu.',
    basePrice: '40000',
    imageUrl: '/img/americano.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 80,
  },
  {
    id: 'prod-cappuccino',
    code: 'CF-CAP',
    name: 'Cappuccino nóng/đá',
    description: 'Sự hòa quyện hoàn hảo giữa espresso đậm đà, sữa nóng và lớp bọt sữa bồng bềnh.',
    basePrice: '45000',
    imageUrl: '/img/cappuccino.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 90,
  },
  {
    id: 'prod-coldbrew',
    code: 'CF-CBR',
    name: 'Cold Brew truyền thống',
    description: 'Cà phê ủ lạnh 18 tiếng giữ trọn hương vị hoa quả tự nhiên, ít chua.',
    basePrice: '45000',
    imageUrl: '/img/coldbrew.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 60,
  },
  {
    id: 'prod-peach-tea',
    code: 'TEA-PEACH',
    name: 'Trà đào cam sả',
    description: 'Trà đen thơm mát kết hợp đào miếng giòn ngọt, sả tươi và hương cam nồng nàn.',
    basePrice: '39000',
    imageUrl: '/img/tradao.jpg',
    category: 'Tea',
    isAvailable: true,
    stockQuantity: 70,
  },
  {
    id: 'prod-matcha-latte',
    code: 'TEA-MATCHA',
    name: 'Matcha Latte Nhật Bản',
    description: 'Bột matcha Uji thượng hạng kết hợp sữa tươi thanh trùng béo ngậy.',
    basePrice: '48000',
    imageUrl: '/img/matchalatte.jpg',
    category: 'Tea',
    isAvailable: true,
    stockQuantity: 50,
  },
  {
    id: 'prod-croissant',
    code: 'PAS-CROI',
    name: 'Bánh Croissant bơ Pháp',
    description: 'Bánh sừng bò ngàn lớp thơm lừng bơ tươi béo ngậy, nướng mới mỗi sáng.',
    basePrice: '30000',
    imageUrl: '/img/croissant.jpg',
    category: 'Pastry',
    isAvailable: true,
    stockQuantity: 40,
  },
];

/** Fetch the full product catalog via GET /products. */
export async function fetchProducts(
  options: { fallbackOnNetworkError?: boolean } = {},
): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, { cache: 'no-store' });
    if (!res.ok) {
      throw new ApiError(res.status, `Failed to load products (${res.status})`);
    }
    return (await res.json()) as Product[];
  } catch (error) {
    if (
      error instanceof ApiError ||
      options.fallbackOnNetworkError === false ||
      process.env.NEXT_PUBLIC_USE_FIXTURES !== 'true'
    ) {
      throw error;
    }
    // Offline samples are allowed only when fixture mode is explicitly enabled.
    return FALLBACK_PRODUCTS;
  }
}

/** Fetch a single product via GET /products/:id. */
export async function fetchProduct(id: string): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new ApiError(res.status, `Failed to load product (${res.status})`);
    }
    return (await res.json()) as Product;
  } catch (error) {
    if (error instanceof ApiError || process.env.NEXT_PUBLIC_USE_FIXTURES !== 'true') {
      throw error;
    }
    // Fallback to offline product if backend is not running
    const found = FALLBACK_PRODUCTS.find((p) => p.id === id || p.code === id);
    if (!found) {
      throw new ApiError(404, `Product with id "${id}" not found`);
    }
    return found;
  }
}

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string;
  basePrice: number | string;
  imageUrl: string;
  category: string;
  stockQuantity?: number;
  isAvailable?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  basePrice?: number | string;
  imageUrl?: string;
  category?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
}

/** Admin: Tạo món mới via POST /products */
export async function createProduct(
  dto: CreateProductInput,
  token: string,
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      errorData.message || `Không thể tạo sản phẩm (${res.status})`,
    );
  }

  return (await res.json()) as Product;
}

/** Admin: Cập nhật món via PATCH /products/:id */
export async function updateProduct(
  id: string,
  dto: UpdateProductInput,
  token: string,
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      errorData.message || `Không thể cập nhật sản phẩm (${res.status})`,
    );
  }

  return (await res.json()) as Product;
}

/** Admin: Xóa món via DELETE /products/:id */
export async function deleteProduct(
  id: string,
  token: string,
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      errorData.message || `Không thể xóa sản phẩm (${res.status})`,
    );
  }

  return (await res.json()) as Product;
}
