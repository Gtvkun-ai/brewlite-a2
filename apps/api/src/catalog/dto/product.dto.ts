/**
 * Response shape for a catalog product. Decimal is serialized as a string by
 * Prisma's Decimal type; expose it as a string to callers.
 */
export class ProductResponseDto {
  id: string;
  code: string;
  name: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stockQuantity: number;
  createdAt: Date;
}
