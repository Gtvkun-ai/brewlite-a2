import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Promotion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = false): Promise<Promotion[]> {
    const where: Prisma.PromotionWhereInput = activeOnly ? { isActive: true } : {};
    return this.prisma.promotion.findMany({
      where,
      orderBy: { validTo: 'desc' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!promo) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi #${id}`);
    }
    return promo;
  }

  async findByCode(code: string): Promise<Promotion> {
    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!promo) {
      throw new NotFoundException(`Mã khuyến mãi "${code}" không tồn tại hoặc đã hết hạn`);
    }
    return promo;
  }

  async create(dto: CreatePromotionDto): Promise<Promotion> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promotion.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(`Mã khuyến mãi "${normalizedCode}" đã tồn tại`);
    }

    return this.prisma.promotion.create({
      data: {
        code: normalizedCode,
        description: dto.description.trim(),
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        minOrderValue: new Prisma.Decimal(dto.minOrderValue ?? 0),
        maxDiscount: dto.maxDiscount ? new Prisma.Decimal(dto.maxDiscount) : null,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    await this.findOne(id);

    const data: Prisma.PromotionUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = new Prisma.Decimal(dto.value);
    if (dto.minOrderValue !== undefined) data.minOrderValue = new Prisma.Decimal(dto.minOrderValue);
    if (dto.maxDiscount !== undefined) {
      data.maxDiscount = dto.maxDiscount ? new Prisma.Decimal(dto.maxDiscount) : null;
    }
    if (dto.validFrom !== undefined) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo !== undefined) data.validTo = new Date(dto.validTo);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.promotion.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Promotion> {
    await this.findOne(id);
    return this.prisma.promotion.delete({
      where: { id },
    });
  }
}
