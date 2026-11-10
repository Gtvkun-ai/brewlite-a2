import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
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

  @Get()
  async getMyOrders(@CurrentUser() userId: string): Promise<OrderResponseDto[]> {
    return this.ordersService.findUserOrders(userId);
  }

  @Get(':id')
  async getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() userId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOrderById(orderId, userId);
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser() userId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(orderId, userId);
  }
}

