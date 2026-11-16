import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
  ArrayUnique,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemSize, ToppingCode } from '../../common/types';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(['REGULAR', 'LARGE'], {
    message: 'selectedSize phải là REGULAR hoặc LARGE',
  })
  selectedSize: ItemSize;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(['TRAN_CHAU', 'KEM_CHEESE', 'THACH_DAO'], {
    each: true,
    message: 'selectedToppings chứa mã topping không hợp lệ',
  })
  selectedToppings?: ToppingCode[];

  @IsOptional()
  @IsInt()
  @IsIn([0, 50, 70, 100])
  selectedSugar?: 0 | 50 | 70 | 100;

  @IsOptional()
  @IsIn(['NORMAL', 'LESS', 'SEPARATE', 'NONE'])
  selectedIce?: 'NORMAL' | 'LESS' | 'SEPARATE' | 'NONE';
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
