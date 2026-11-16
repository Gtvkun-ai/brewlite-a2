import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import {
  InventoryMovementType,
  PrismaClient,
  RecipeSize,
  Role,
} from '@prisma/client';
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
        await this.ensureInventorySeedData();
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

      await this.ensureInventorySeedData();

      this.logger.log('Auto-seed completed successfully!');
    } catch (err) {
      this.logger.warn(`Auto-seed non-fatal error: ${err}`);
    }
  }

  private async ensureInventorySeedData(): Promise<void> {
    const baseline = [
      {
        code: 'ING-COFFEE-ROBUSTA',
        name: 'Cà phê hạt Robusta Buôn Ma Thuột',
        unit: 'g',
        currentStock: 500,
        baselineStock: 500,
        minThreshold: 50,
        category: 'Coffee',
      },
      {
        code: 'ING-MILK-FRESH',
        name: 'Sữa tươi thanh trùng Đà Lạt Milk',
        unit: 'ml',
        currentStock: 1000,
        baselineStock: 1000,
        minThreshold: 100,
        category: 'Dairy',
      },
      {
        code: 'ING-SUGAR-REFINED',
        name: 'Đường mía tinh luyện Biên Hòa',
        unit: 'g',
        currentStock: 200,
        baselineStock: 200,
        minThreshold: 20,
        category: 'Sweetener',
      },
    ];
    const ingredients = new Map<string, { id: string }>();

    for (const material of baseline) {
      const existing = await this.ingredient.findUnique({
        where: { code: material.code },
        select: { id: true },
      });
      const ingredient = await this.ingredient.upsert({
        where: { code: material.code },
        update: {
          name: material.name,
          unit: material.unit,
          baselineStock: material.baselineStock,
          minThreshold: material.minThreshold,
          category: material.category,
        },
        create: material,
        select: { id: true },
      });
      ingredients.set(material.code, ingredient);

      if (!existing) {
        await this.inventoryMovement.create({
          data: {
            ingredientId: ingredient.id,
            ingredientCodeSnapshot: material.code,
            ingredientNameSnapshot: material.name,
            unitSnapshot: material.unit,
            type: InventoryMovementType.OPENING,
            amount: material.currentStock,
            beforeStock: 0,
            afterStock: material.currentStock,
            note: 'Tồn kho đầu kỳ',
            referenceKey: `seed-opening:${material.code}`,
          },
        });
      }
    }

    const recipes: Array<{
      productCode: string;
      size: RecipeSize;
      ingredientCode: string;
      amount: number;
    }> = [
      { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 10 },
      { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-MILK-FRESH', amount: 50 },
      { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-SUGAR-REFINED', amount: 5 },
      { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 15 },
      { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-MILK-FRESH', amount: 75 },
      { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-SUGAR-REFINED', amount: 8 },
      { productCode: 'CF-AME', size: RecipeSize.REGULAR, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 15 },
      { productCode: 'CF-AME', size: RecipeSize.LARGE, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 20 },
    ];

    for (const recipe of recipes) {
      const product = await this.product.findUnique({
        where: { code: recipe.productCode },
        select: { code: true },
      });
      const ingredient = ingredients.get(recipe.ingredientCode);
      if (!product || !ingredient) continue;

      await this.productRecipe.upsert({
        where: {
          productCode_size_ingredientId: {
            productCode: recipe.productCode,
            size: recipe.size,
            ingredientId: ingredient.id,
          },
        },
        update: {},
        create: {
          productCode: recipe.productCode,
          size: recipe.size,
          ingredientId: ingredient.id,
          amount: recipe.amount,
        },
      });
    }
  }
}
