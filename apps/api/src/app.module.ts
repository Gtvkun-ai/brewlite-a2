import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [PrismaModule, CatalogModule],
})
export class AppModule {}
