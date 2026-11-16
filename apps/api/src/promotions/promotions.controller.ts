import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Promotion, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  findActive(): Promise<Promotion[]> {
    return this.promotionsService.findAll(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query('activeOnly') activeOnly?: string): Promise<Promotion[]> {
    return this.promotionsService.findAll(activeOnly === 'true');
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string): Promise<Promotion> {
    return this.promotionsService.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreatePromotionDto): Promise<Promotion> {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ): Promise<Promotion> {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id') id: string): Promise<Promotion> {
    return this.promotionsService.remove(id);
  }
}
