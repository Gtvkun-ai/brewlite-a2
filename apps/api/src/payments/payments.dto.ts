import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

const ONLINE_PAYMENT_METHODS = [
  PaymentMethod.E_WALLET,
  PaymentMethod.VIETQR_MOMO,
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.DOMESTIC_ATM,
] as const;

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsIn(ONLINE_PAYMENT_METHODS)
  method!: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  accountRef!: string;
}
