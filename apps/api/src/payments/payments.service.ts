import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './payments.dto';
import { PaymentError } from './payment.errors';
import { MockGatewayService } from './mock-gateway.service';

const KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;
const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
];

type PaymentResponse = {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  orderStatus: OrderStatus;
  amount: string;
  method: PaymentMethod;
  transactionRef?: string | null;
  message?: string;
  createdAt: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockGatewayService,
  ) {}

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ): Promise<PaymentResponse> {
    const key = this.validateKey(idempotencyKey);
    const requestHash = this.hashRequest(userId, dto);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${dto.orderId} FOR UPDATE`;

        const order = await tx.order.findFirst({
          where: { id: dto.orderId, userId },
          include: {
            items: { select: { productId: true, quantity: true } },
          },
        });
        if (!order) {
          throw new NotFoundException({
            errorCode: 'ORDER_ACCESS_DENIED',
            message: 'Không tìm thấy đơn hàng của tài khoản hiện tại',
          });
        }

        const existing = await tx.payment.findUnique({
          where: { idempotencyKey: key },
        });
        if (existing) {
          if (existing.orderId !== order.id || existing.paymentGatewayResponse &&
              this.readRequestHash(existing.paymentGatewayResponse) !== requestHash) {
            throw new ConflictException({
              errorCode: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
              message: 'Idempotency-Key đã được dùng với payload khác',
            });
          }
          return this.toResponse(existing, order.status);
        }

        if (PAID_STATUSES.includes(order.status)) {
          throw new PaymentError(
            400,
            'ORDER_ALREADY_PAID',
            'Đơn hàng đã được thanh toán',
          );
        }
        if (
          order.status !== OrderStatus.PENDING &&
          order.status !== OrderStatus.PAYMENT_FAILED
        ) {
          throw new PaymentError(
            409,
            'ORDER_NOT_PAYABLE',
            `Đơn hàng ở trạng thái ${order.status} không thể thanh toán`,
          );
        }

        const amount = order.totalAmount;
        const gatewayResult = this.gateway.charge({
          accountRef: dto.accountRef,
          amount: amount.toString(),
          method: dto.method,
        });

        if (order.status === OrderStatus.PAYMENT_FAILED) {
          await this.reserveInventory(tx, order.items);
        }

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            method: dto.method,
            status:
              gatewayResult.status === 'SUCCESS'
                ? PaymentStatus.SUCCESS
                : PaymentStatus.FAILED,
            amount,
            transactionRef:
              gatewayResult.status === 'SUCCESS'
                ? gatewayResult.transactionRef
                : null,
            idempotencyKey: key,
            paymentGatewayResponse: {
              requestHash,
              ...(gatewayResult.status === 'FAILED'
                ? { message: gatewayResult.message }
                : {}),
            },
          },
        });

        if (gatewayResult.status === 'SUCCESS') {
          const updated = await tx.order.updateMany({
            where: { id: order.id, status: order.status },
            data: { status: OrderStatus.PAID },
          });
          if (updated.count !== 1) {
            throw new ConflictException({
              errorCode: 'ORDER_STATE_CHANGED',
              message: 'Trạng thái đơn hàng đã thay đổi',
            });
          }
        } else {
          await this.releaseInventory(tx, order.items);
          const updated = await tx.order.updateMany({
            where: { id: order.id, status: order.status },
            data: { status: OrderStatus.PAYMENT_FAILED },
          });
          if (updated.count !== 1) {
            throw new ConflictException({
              errorCode: 'ORDER_STATE_CHANGED',
              message: 'Trạng thái đơn hàng đã thay đổi',
            });
          }
        }

        return this.toResponse(
          payment,
          gatewayResult.status === 'SUCCESS'
            ? OrderStatus.PAID
            : OrderStatus.PAYMENT_FAILED,
        );
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          errorCode: 'PAYMENT_REQUEST_IN_PROGRESS',
          message: 'Yêu cầu thanh toán đang được xử lý',
        });
      }
      this.logger.error(
        `payment.create.failed orderId=${dto.orderId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      throw error;
    }
  }

  private validateKey(key?: string): string {
    const value = key?.trim();
    if (!value || value.length > 200 || !KEY_PATTERN.test(value)) {
      throw new PaymentError(
        400,
        'INVALID_IDEMPOTENCY_KEY',
        'Idempotency-Key không hợp lệ',
      );
    }
    return value;
  }

  private hashRequest(userId: string, dto: CreatePaymentDto): string {
    return createHash('sha256')
      .update(
        JSON.stringify([
          userId,
          dto.orderId,
          dto.method,
          this.accountFingerprint(dto.accountRef),
        ]),
      )
      .digest('hex');
  }

  private accountFingerprint(accountRef: string): string {
    return createHash('sha256').update(accountRef).digest('hex');
  }

  private readRequestHash(response: Prisma.JsonValue): string | undefined {
    if (
      typeof response === 'object' &&
      response !== null &&
      !Array.isArray(response) &&
      typeof response.requestHash === 'string'
    ) {
      return response.requestHash;
    }
    return undefined;
  }

  private async reserveInventory(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          isAvailable: true,
          stockQuantity: { gte: item.quantity },
        },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (result.count !== 1) {
        throw new PaymentError(
          409,
          'OUT_OF_STOCK',
          'Không đủ tồn kho để thử lại thanh toán',
        );
      }
    }
  }

  private async releaseInventory(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  }

  private toResponse(
    payment: {
      id: string;
      orderId: string;
      status: PaymentStatus;
      amount: Prisma.Decimal;
      method: PaymentMethod;
      transactionRef: string | null;
      createdAt: Date;
      paymentGatewayResponse: Prisma.JsonValue | null;
    },
    orderStatus: OrderStatus,
  ): PaymentResponse {
    const message = this.readMessage(payment.paymentGatewayResponse);
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      orderStatus:
        payment.status === PaymentStatus.SUCCESS
          ? OrderStatus.PAID
          : orderStatus === OrderStatus.PAID
            ? OrderStatus.PAID
            : OrderStatus.PAYMENT_FAILED,
      amount: payment.amount.toString(),
      method: payment.method,
      transactionRef: payment.transactionRef,
      ...(message ? { message } : {}),
      createdAt: payment.createdAt.toISOString(),
    };
  }

  private readMessage(response: Prisma.JsonValue | null): string | undefined {
    if (
      typeof response === 'object' &&
      response !== null &&
      !Array.isArray(response) &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }
    return undefined;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
