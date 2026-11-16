import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryDemoController } from './inventory-demo.controller';
import { InventoryDemoService } from './inventory-demo.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [InventoryController, InventoryDemoController],
  providers: [InventoryService, InventoryDemoService],
  exports: [InventoryService],
})
export class InventoryModule {}
