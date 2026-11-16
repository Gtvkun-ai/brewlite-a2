import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả khuyến mãi không được để trống' })
  description: string;

  @IsEnum(PromotionType, { message: 'Loại khuyến mãi không hợp lệ (PERCENTAGE hoặc FIXED_AMOUNT)' })
  type: PromotionType;

  @IsNotEmpty({ message: 'Giá trị giảm không được để trống' })
  value: number | string;

  @IsOptional()
  minOrderValue?: number | string;

  @IsOptional()
  maxDiscount?: number | string;

  @IsDateString({}, { message: 'Thời gian bắt đầu phải là định dạng ngày ISO' })
  validFrom: string;

  @IsDateString({}, { message: 'Thời gian kết thúc phải là định dạng ngày ISO' })
  validTo: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PromotionType)
  @IsOptional()
  type?: PromotionType;

  @IsOptional()
  value?: number | string;

  @IsOptional()
  minOrderValue?: number | string;

  @IsOptional()
  maxDiscount?: number | string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
