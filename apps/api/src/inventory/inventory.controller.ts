import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  Ingredient,
  ProductRecipe,
  BottleneckForecast,
  TestDSimulationResult,
} from './inventory.types';

class UpdateStockDto {
  newStock: number;
}

class RestockDto {
  code: string;
  amountToAdd: number;
  supplierOrNote?: string;
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('materials')
  getMaterials(): Ingredient[] {
    return this.inventoryService.getMaterials();
  }

  @Get('inbound-logs')
  getInboundLogs() {
    return this.inventoryService.getInboundLogs();
  }

  @Post('restock')
  restock(@Body() dto: RestockDto) {
    return this.inventoryService.restock(
      dto.code,
      Number(dto.amountToAdd),
      dto.supplierOrNote,
    );
  }

  @Put('materials/:code')
  updateMaterial(
    @Param('code') code: string,
    @Body() dto: UpdateStockDto,
  ): Ingredient {
    return this.inventoryService.updateMaterialStock(code, Number(dto.newStock));
  }

  @Get('recipes')
  getRecipes(): ProductRecipe[] {
    return this.inventoryService.getRecipes();
  }

  @Get('bottleneck-forecast')
  getBottleneckForecast(
    @Query('size') size?: 'REGULAR' | 'LARGE',
  ): BottleneckForecast[] {
    return this.inventoryService.calculateAllBottlenecks(size || 'REGULAR');
  }

  @Post('test-d-simulation')
  runTestDSimulation(): TestDSimulationResult {
    return this.inventoryService.runTestDSimulation();
  }

  @Post('reset-demo')
  resetDemoStock(): { success: boolean; message: string } {
    return this.inventoryService.resetStock();
  }
}
