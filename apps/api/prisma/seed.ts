import {
  InventoryMovementType,
  PrismaClient,
  RecipeSize,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  {
    code: 'CF-SALT',
    name: 'Cà phê muối',
    description: 'Cà phê rang mộc đậm đà kết hợp lớp kem muối béo mịn.',
    basePrice: 39000,
    imageUrl: '/img/caphesua.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 100,
  },
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

async function main() {
  console.log('Seeding BrewLite database...');

  // 1. Seed Products (upsert idempotent)
  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      // Seed only missing catalog entries: restarting must preserve admin edits
      // and the inventory already consumed by real orders.
      update: {},
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products with VND pricing.`);

  const ingredients = [
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
  const ingredientIds = new Map<string, string>();
  for (const material of ingredients) {
    const existing = await prisma.ingredient.findUnique({
      where: { code: material.code },
      select: { id: true },
    });
    const ingredient = await prisma.ingredient.upsert({
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
    ingredientIds.set(material.code, ingredient.id);
    if (!existing) {
      await prisma.inventoryMovement.create({
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

  const recipes = [
    { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 10 },
    { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-MILK-FRESH', amount: 50 },
    { productCode: 'CF-MILK', size: RecipeSize.REGULAR, ingredientCode: 'ING-SUGAR-REFINED', amount: 5 },
    { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 15 },
    { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-MILK-FRESH', amount: 75 },
    { productCode: 'CF-MILK', size: RecipeSize.LARGE, ingredientCode: 'ING-SUGAR-REFINED', amount: 8 },
    { productCode: 'CF-AME', size: RecipeSize.REGULAR, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 15 },
    { productCode: 'CF-AME', size: RecipeSize.LARGE, ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 20 },
  ];
  for (const { productCode, size, ingredientCode, amount } of recipes) {
    const ingredientId = ingredientIds.get(ingredientCode);
    if (!ingredientId) continue;
    await prisma.productRecipe.upsert({
      where: {
        productCode_size_ingredientId: {
          productCode,
          size,
          ingredientId,
        },
      },
      update: {},
      create: { productCode, size, amount, ingredientId },
    });
  }
  console.log('Seeded persistent BOM ingredients, recipes, and opening movements.');

  // Demo accounts are for local development and automated tests only.
  // Never create known-password accounts in a production database.
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipped demo-account seeding in production.');
    return;
  }

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  const e2ePassword = process.env.E2E_ACCOUNT_PASSWORD;
  if (!demoPassword || !e2ePassword) {
    console.log(
      'Skipped demo-account seeding; set local demo password environment variables to enable it.',
    );
    return;
  }
  if (
    demoPassword.length < 8 ||
    e2ePassword.length < 8 ||
    Buffer.byteLength(demoPassword, 'utf8') > 72 ||
    Buffer.byteLength(e2ePassword, 'utf8') > 72
  ) {
    throw new Error('Local demo passwords must be 8–72 UTF-8 bytes.');
  }

  // 2. Seed Demo Accounts
  const defaultPasswordHash = await bcrypt.hash(demoPassword, 10);
  const e2ePasswordHash = await bcrypt.hash(e2ePassword, 10);

  const demoUsers = [
    {
      email: 'customer@brewlite.vn',
      fullName: 'Khách hàng Demo',
      phone: '0901234567',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
    {
      email: 'customer@brewlite.test',
      fullName: 'Khách hàng Test',
      phone: '0901234568',
      passwordHash: defaultPasswordHash,
      role: Role.CUSTOMER,
    },
    {
      email: 'e2e.customer@brewlite.test',
      fullName: 'Khách hàng E2E Automation',
      phone: '0901234569',
      passwordHash: e2ePasswordHash,
      role: Role.CUSTOMER,
    },
    {
      email: 'barista@brewlite.vn',
      fullName: 'Nhân viên Pha chế',
      phone: '0907654321',
      passwordHash: defaultPasswordHash,
      role: Role.BARISTA,
    },
    {
      email: 'admin@brewlite.vn',
      fullName: 'Quản trị viên Hệ thống',
      phone: '0909999999',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
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
  console.log(`Seeded ${demoUsers.length} local demo accounts.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
