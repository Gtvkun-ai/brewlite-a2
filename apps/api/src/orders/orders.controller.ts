import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() userId: string,
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(userId, createOrderDto, idempotencyKey);
  }
}
