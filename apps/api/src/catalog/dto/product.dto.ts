import {
  IsBoolean,
  IsNotEmpty,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Min,
  Max,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const numericPrice = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() ? Number(value) : value;

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
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @ValidateIf((_object, value) => value !== undefined)
  @MaxLength(2000)
  description?: string;

  @Transform(numericPrice)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(1)
  basePrice: number | string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @Matches(/^(?:\/(?!\/)|https?:\/\/)/)
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Coffee', 'Tea', 'Pastry'])
  category: string;

  @IsBoolean()
  @ValidateIf((_object, value) => value !== undefined)
  isAvailable?: boolean;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ValidateIf((_object, value) => value !== undefined)
  stockQuantity?: number;
}

export class UpdateProductDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @ValidateIf((_object, value) => value !== undefined)
  name?: string;

  @IsString()
  @MaxLength(2000)
  @ValidateIf((_object, value) => value !== undefined)
  description?: string;

  @Transform(numericPrice)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(1)
  @ValidateIf((_object, value) => value !== undefined)
  basePrice?: number | string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @Matches(/^(?:\/(?!\/)|https?:\/\/)/)
  @ValidateIf((_object, value) => value !== undefined)
  imageUrl?: string;

  @IsString()
  @IsIn(['Coffee', 'Tea', 'Pastry'])
  @ValidateIf((_object, value) => value !== undefined)
  category?: string;

  @IsBoolean()
  @ValidateIf((_object, value) => value !== undefined)
  isAvailable?: boolean;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ValidateIf((_object, value) => value !== undefined)
  stockQuantity?: number;
}
