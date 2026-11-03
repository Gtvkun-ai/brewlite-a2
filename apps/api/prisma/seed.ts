import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    code: 'ESP-001',
    name: 'Classic Espresso',
    description: 'A bold single shot of our house espresso blend.',
    basePrice: 2.5,
    imageUrl: 'https://images.brewlite.local/espresso.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 120,
  },
  {
    code: 'LAT-001',
    name: 'Vanilla Latte',
    description: 'Smooth espresso with steamed milk and vanilla syrup.',
    basePrice: 4.25,
    imageUrl: 'https://images.brewlite.local/vanilla-latte.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 90,
  },
  {
    code: 'CAP-001',
    name: 'Cappuccino',
    description: 'Equal parts espresso, steamed milk, and velvety foam.',
    basePrice: 3.75,
    imageUrl: 'https://images.brewlite.local/cappuccino.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 80,
  },
  {
    code: 'CBR-001',
    name: 'Cold Brew',
    description: 'Slow-steeped for 18 hours for a smooth, low-acid finish.',
    basePrice: 4.0,
    imageUrl: 'https://images.brewlite.local/cold-brew.jpg',
    category: 'Coffee',
    isAvailable: true,
    stockQuantity: 60,
  },
  {
    code: 'TEA-001',
    name: 'Jasmine Green Tea',
    description: 'Fragrant jasmine-scented green tea, served hot or iced.',
    basePrice: 3.25,
    imageUrl: 'https://images.brewlite.local/jasmine-tea.jpg',
    category: 'Tea',
    isAvailable: true,
    stockQuantity: 70,
  },
  {
    code: 'TEA-002',
    name: 'Matcha Latte',
    description: 'Stone-ground matcha whisked with steamed milk.',
    basePrice: 4.5,
    imageUrl: 'https://images.brewlite.local/matcha-latte.jpg',
    category: 'Tea',
    isAvailable: true,
    stockQuantity: 50,
  },
  {
    code: 'PAS-001',
    name: 'Butter Croissant',
    description: 'Flaky, all-butter croissant baked fresh each morning.',
    basePrice: 3.0,
    imageUrl: 'https://images.brewlite.local/croissant.jpg',
    category: 'Pastry',
    isAvailable: true,
    stockQuantity: 40,
  },
  {
    code: 'PAS-002',
    name: 'Blueberry Muffin',
    description: 'Moist muffin loaded with wild blueberries.',
    basePrice: 3.5,
    imageUrl: 'https://images.brewlite.local/blueberry-muffin.jpg',
    category: 'Pastry',
    isAvailable: false,
    stockQuantity: 0,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
