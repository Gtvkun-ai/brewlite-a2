import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Mã sản phẩm "${dto.code}" đã tồn tại.`);
    }

    return this.prisma.product.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description || '',
        basePrice: new Prisma.Decimal(String(dto.basePrice)),
        imageUrl: dto.imageUrl,
        category: dto.category,
        isAvailable: dto.isAvailable ?? true,
        stockQuantity: dto.stockQuantity ?? 100,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(id);

    const updateData: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.basePrice !== undefined) {
      updateData.basePrice = new Prisma.Decimal(String(dto.basePrice));
    }
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.isAvailable !== undefined) updateData.isAvailable = dto.isAvailable;
    if (dto.stockQuantity !== undefined) {
      updateData.stockQuantity = dto.stockQuantity;
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
