import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: OrderStatus.PREPARING,
  PREPARING: OrderStatus.READY,
  READY: OrderStatus.COMPLETED,
};

/** Local presentation mode. Every displayed state still comes from the database. */
@Injectable()
export class OrdersDemoProgressService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersDemoProgressService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'production' || process.env.DEMO_ORDER_PROGRESSION !== 'true') return;
    this.logger.warn('DEMO_ORDER_PROGRESSION enabled: paid orders advance every 10 seconds.');
    this.timer = setInterval(() => void this.advanceOrders(), 2000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async advanceOrders(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const cutoff = new Date(Date.now() - 10_000);
      const orders = await this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] },
          updatedAt: { lte: cutoff },
        },
        select: { id: true, status: true },
      });
      for (const order of orders) {
        const nextStatus = NEXT_STATUS[order.status];
        if (!nextStatus) continue;
        // Compare-and-set lets a staff update or cancellation win safely.
        await this.prisma.order.updateMany({
          where: { id: order.id, status: order.status, updatedAt: { lte: cutoff } },
          data: { status: nextStatus },
        });
      }
    } catch (error) {
      this.logger.error(`Demo order progression failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      this.running = false;
    }
  }
}
