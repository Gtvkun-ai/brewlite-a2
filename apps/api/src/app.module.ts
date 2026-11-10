import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    CatalogModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
