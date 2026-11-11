import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../common/types';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái đơn hàng không được để trống' })
  @IsEnum(
    [
      'PENDING',
      'PAID',
      'PREPARING',
      'READY',
      'COMPLETED',
      'CANCELLED',
      'PAYMENT_FAILED',
    ],
    {
      message: 'Trạng thái đơn hàng không hợp lệ',
    },
  )
  status: OrderStatus;
}
