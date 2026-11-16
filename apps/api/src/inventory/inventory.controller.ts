import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RecipeSize, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { InventoryService } from './inventory.service';
import { Ingredient, ProductRecipe } from './inventory.types';

class UpdateStockDto {
  @Transform(({ value }) =>
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN,
  )
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(999999999999.99)
  newStock: number;
}

class RestockDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @Transform(({ value }) =>
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN,
  )
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(999999999999.99)
  amountToAdd: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  supplierOrNote?: string;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BARISTA, Role.MANAGER, Role.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('materials')
  getMaterials(): Promise<Ingredient[]> {
    return this.inventoryService.getMaterials();
  }

  @Get('inbound-logs')
  getInboundLogs() {
    return this.inventoryService.getInboundLogs();
  }

  @Post('restock')
  @Roles(Role.ADMIN, Role.MANAGER)
  restock(@Body() dto: RestockDto) {
    return this.inventoryService.restock(
      dto.code,
      dto.amountToAdd,
      dto.supplierOrNote,
    );
  }

  @Put('materials/:code')
  @Roles(Role.ADMIN, Role.MANAGER)
  updateMaterial(
    @Param('code') code: string,
    @Body() dto: UpdateStockDto,
  ): Promise<Ingredient> {
    return this.inventoryService.updateMaterialStock(code, dto.newStock);
  }

  @Get('recipes')
  getRecipes(): Promise<ProductRecipe[]> {
    return this.inventoryService.getRecipes();
  }

  @Get('bottleneck-forecast')
  getBottleneckForecast(@Query('size') size?: string) {
    if (size && !Object.values(RecipeSize).includes(size as RecipeSize)) {
      throw new BadRequestException('Kích cỡ chỉ được là REGULAR hoặc LARGE');
    }
    return this.inventoryService.calculateAllBottlenecks(
      (size as RecipeSize | undefined) ?? RecipeSize.REGULAR,
    );
  }
}
