import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PromotionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/promotion.dto';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let prisma: {
    promotion: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockPromo = {
    id: 'promo-1',
    code: 'CHAOBANMOI',
    description: 'Giảm 20% cho khách hàng mới',
    type: PromotionType.PERCENTAGE,
    value: new Prisma.Decimal(20),
    minOrderValue: new Prisma.Decimal(50000),
    maxDiscount: new Prisma.Decimal(30000),
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: new Date('2026-12-31T23:59:59Z'),
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      promotion: {
        findMany: jest.fn().mockResolvedValue([mockPromo]),
        findUnique: jest.fn().mockResolvedValue(mockPromo),
        create: jest.fn().mockResolvedValue(mockPromo),
        update: jest.fn().mockResolvedValue({ ...mockPromo, description: 'Updated' }),
        delete: jest.fn().mockResolvedValue(mockPromo),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('findAll queries promotions with optional active filter', async () => {
    const result = await service.findAll(true);
    expect(result).toEqual([mockPromo]);
    expect(prisma.promotion.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { validTo: 'desc' },
    });
  });

  it('findByCode normalizes code and returns promotion', async () => {
    const result = await service.findByCode('chaobanmoi');
    expect(result).toEqual(mockPromo);
    expect(prisma.promotion.findUnique).toHaveBeenCalledWith({
      where: { code: 'CHAOBANMOI' },
    });
  });

  it('findByCode throws NotFoundException when not found', async () => {
    prisma.promotion.findUnique.mockResolvedValueOnce(null);
    await expect(service.findByCode('NOTFOUND')).rejects.toThrow(NotFoundException);
  });

  it('create saves new promotion when code does not exist', async () => {
    prisma.promotion.findUnique.mockResolvedValueOnce(null);
    const dto: CreatePromotionDto = {
      code: 'NEWCODE',
      description: 'Mới',
      type: PromotionType.FIXED_AMOUNT,
      value: 15000,
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2026-12-31T23:59:59Z',
    };
    const result = await service.create(dto);
    expect(result).toEqual(mockPromo);
    expect(prisma.promotion.create).toHaveBeenCalled();
  });

  it('create throws ConflictException when code already exists', async () => {
    const dto: CreatePromotionDto = {
      code: 'CHAOBANMOI',
      description: 'Trùng mã',
      type: PromotionType.PERCENTAGE,
      value: 10,
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2026-12-31T23:59:59Z',
    };
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('update modifies promotion when found', async () => {
    const result = await service.update('promo-1', { description: 'Updated' });
    expect(result.description).toBe('Updated');
    expect(prisma.promotion.update).toHaveBeenCalled();
  });

  it('remove deletes promotion when found', async () => {
    const result = await service.remove('promo-1');
    expect(result).toEqual(mockPromo);
    expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 'promo-1' } });
  });
});
