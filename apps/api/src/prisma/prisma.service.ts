import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.ensureSeedData();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async ensureSeedData(): Promise<void> {
    try {
      const productCount = await this.product.count();
      if (productCount > 0) {
        return;
      }
      this.logger.log('Database empty: auto-seeding products and test accounts...');

      const products = [
        {
          code: 'CF-MILK',
          name: 'Cà phê sữa đá',
          description: 'Cà phê Robusta đậm đà pha phin truyền thống kết hợp sữa đặc ngọt béo.',
          basePrice: 35000,
          imageUrl: '/img/caphesua.jpg',
          category: 'Coffee',
          isAvailable: true,
          stockQuantity: 100,
        },
        {
          code: 'CF-AME',
          name: 'Americano đá',
          description: 'Espresso nguyên chất pha loãng với nước tinh khiết, vị đắng thanh dịu.',
          basePrice: 40000,
          imageUrl: '/img/americano.jpg',
          category: 'Coffee',
          isAvailable: true,
          stockQuantity: 80,
        },
        {
          code: 'CF-CAP',
          name: 'Cappuccino nóng/đá',
          description: 'Sự hòa quyện hoàn hảo giữa espresso đậm đà, sữa nóng và lớp bọt sữa bồng bềnh.',
          basePrice: 45000,
          imageUrl: '/img/cappuccino.jpg',
          category: 'Coffee',
          isAvailable: true,
          stockQuantity: 90,
        },
        {
          code: 'CF-CBR',
          name: 'Cold Brew truyền thống',
          description: 'Cà phê ủ lạnh 18 tiếng giữ trọn hương vị hoa quả tự nhiên, ít chua.',
          basePrice: 45000,
          imageUrl: '/img/coldbrew.jpg',
          category: 'Coffee',
          isAvailable: true,
          stockQuantity: 60,
        },
        {
          code: 'TEA-PEACH',
          name: 'Trà đào cam sả',
          description: 'Trà đen thơm mát kết hợp đào miếng giòn ngọt, sả tươi và hương cam nồng nàn.',
          basePrice: 39000,
          imageUrl: '/img/tradao.jpg',
          category: 'Tea',
          isAvailable: true,
          stockQuantity: 70,
        },
        {
          code: 'TEA-MATCHA',
          name: 'Matcha Latte Nhật Bản',
          description: 'Bột matcha Uji thượng hạng kết hợp sữa tươi thanh trùng béo ngậy.',
          basePrice: 48000,
          imageUrl: '/img/matchalatte.jpg',
          category: 'Tea',
          isAvailable: true,
          stockQuantity: 50,
        },
        {
          code: 'PAS-CROI',
          name: 'Bánh Croissant bơ Pháp',
          description: 'Bánh sừng bò ngàn lớp thơm lừng bơ tươi béo ngậy, nướng mới mỗi sáng.',
          basePrice: 30000,
          imageUrl: '/img/croissant.jpg',
          category: 'Pastry',
          isAvailable: true,
          stockQuantity: 40,
        },
      ];

      for (const prod of products) {
        await this.product.upsert({
          where: { code: prod.code },
          update: prod,
          create: prod,
        });
      }

      const hash1 = await bcrypt.hash('Password123!', 10);
      const hash2 = await bcrypt.hash('Customer@123456', 10);
      const hashE2E = await bcrypt.hash('E2e-Only-Password1!', 10);

      const demoUsers = [
        {
          email: 'customer@brewlite.vn',
          fullName: 'Khách hàng Demo',
          phone: '0901234567',
          passwordHash: hash1,
          role: Role.CUSTOMER,
        },
        {
          email: 'customer@brewlite.test',
          fullName: 'Khách hàng Test',
          phone: '0901234568',
          passwordHash: hash2,
          role: Role.CUSTOMER,
        },
        {
          email: 'e2e.customer@brewlite.test',
          fullName: 'Khách hàng E2E Automation',
          phone: '0901234569',
          passwordHash: hashE2E,
          role: Role.CUSTOMER,
        },
        {
          email: 'barista@brewlite.vn',
          fullName: 'Nhân viên Pha chế',
          phone: '0907654321',
          passwordHash: hash1,
          role: Role.BARISTA,
        },
        {
          email: 'admin@brewlite.vn',
          fullName: 'Quản trị viên Hệ thống',
          phone: '0909999999',
          passwordHash: hash1,
          role: Role.ADMIN,
        },
      ];

      for (const user of demoUsers) {
        await this.user.upsert({
          where: { email: user.email },
          update: {
            fullName: user.fullName,
            phone: user.phone,
            passwordHash: user.passwordHash,
            role: user.role,
          },
          create: user,
        });
      }

      this.logger.log('Auto-seed completed successfully!');
    } catch (err) {
      this.logger.warn(`Auto-seed non-fatal error: ${err}`);
    }
  }
}
