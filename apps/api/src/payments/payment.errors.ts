import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentError extends HttpException {
  constructor(
    status: HttpStatus,
    errorCode: string,
    message: string,
  ) {
    super({ statusCode: status, errorCode, message }, status);
  }
}
