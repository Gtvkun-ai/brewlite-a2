import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  basePrice: number | string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  basePrice?: number | string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;
}
