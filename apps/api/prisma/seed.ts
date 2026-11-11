import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Seeding BrewLite database...');

  // 1. Seed Products (upsert idempotent)
  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products with VND pricing.`);

  // 2. Seed Demo Accounts
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const e2ePasswordHash = await bcrypt.hash('E2e-Only-Password1!', 10);

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
  console.log(`Seeded ${demoUsers.length} demo accounts (Password: Password123!).`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
