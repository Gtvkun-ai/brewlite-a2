import { Test, TestingModule } from '@nestjs/testing';
import { PromotionType } from '@prisma/client';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByCode: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockPromo = {
    id: 'promo-1',
    code: 'CHAOBANMOI',
    description: 'Giảm 20% cho khách hàng mới',
    type: PromotionType.PERCENTAGE,
    value: 20,
    minOrderValue: 50000,
    maxDiscount: 30000,
    validFrom: new Date(),
    validTo: new Date(),
    isActive: true,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([mockPromo]),
      findOne: jest.fn().mockResolvedValue(mockPromo),
      findByCode: jest.fn().mockResolvedValue(mockPromo),
      create: jest.fn().mockResolvedValue(mockPromo),
      update: jest.fn().mockResolvedValue({ ...mockPromo, description: 'Updated' }),
      remove: jest.fn().mockResolvedValue(mockPromo),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
  });

  it('findActive delegates to service.findAll(true)', async () => {
    const result = await controller.findActive();
    expect(result).toEqual([mockPromo]);
    expect(service.findAll).toHaveBeenCalledWith(true);
  });

  it('findAll for admin delegates to service.findAll with activeOnly flag', async () => {
    const result = await controller.findAll('false');
    expect(result).toEqual([mockPromo]);
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('findByCode delegates to service.findByCode', async () => {
    const result = await controller.findByCode('CHAOBANMOI');
    expect(result).toEqual(mockPromo);
    expect(service.findByCode).toHaveBeenCalledWith('CHAOBANMOI');
  });

  it('create delegates to service.create', async () => {
    const dto: CreatePromotionDto = {
      code: 'CHAOBANMOI',
      description: 'Giảm 20%',
      type: PromotionType.PERCENTAGE,
      value: 20,
      validFrom: '2026-01-01T00:00:00.000Z',
      validTo: '2026-12-31T23:59:59.000Z',
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockPromo);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates to service.update', async () => {
    const dto: UpdatePromotionDto = { description: 'Updated' };
    const result = await controller.update('promo-1', dto);
    expect(result.description).toBe('Updated');
    expect(service.update).toHaveBeenCalledWith('promo-1', dto);
  });

  it('remove delegates to service.remove', async () => {
    const result = await controller.remove('promo-1');
    expect(result).toEqual(mockPromo);
    expect(service.remove).toHaveBeenCalledWith('promo-1');
  });
});
