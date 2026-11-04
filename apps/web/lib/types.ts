/**
 * Product shape returned by the BrewLite API (GET /products, GET /products/:id).
 * Mirrors apps/api ProductResponseDto: Prisma serializes Decimal `basePrice`
 * as a string and `createdAt` as an ISO string over JSON.
 */
export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stockQuantity: number;
  createdAt?: string;
}
