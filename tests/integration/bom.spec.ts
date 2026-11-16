import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  InventoryMovementType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  RecipeSize,
  Role,
} from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from '../../apps/api/src/inventory/inventory.service';
import { OrdersService } from '../../apps/api/src/orders/orders.service';
import { PaymentsService } from '../../apps/api/src/payments/payments.service';
import { MockGatewayService } from '../../apps/api/src/payments/mock-gateway.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

const REGULAR_RECIPE = [
  { codeSuffix: 'COFFEE', amount: 10 },
  { codeSuffix: 'MILK', amount: 50 },
  { codeSuffix: 'SUGAR', amount: 5 },
] as const;

type BomFixture = {
  userId: string;
  productId: string;
  productCode: string;
  ingredientIds: Record<(typeof REGULAR_RECIPE)[number]['codeSuffix'], string>;
};

function testOrder(fixture: BomFixture, idempotencyKey: string, quantity = 1) {
  return {
    idempotencyKey,
    items: [
      {
        productId: fixture.productId,
        quantity,
        selectedSize: 'REGULAR' as const,
      },
    ],
  };
}

export async function runBomPostgresIntegration(): Promise<void> {
  const dbUrl = process.env.BOM_TEST_DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      'Set BOM_TEST_DATABASE_URL to an isolated PostgreSQL database whose name contains "test" or "demo".',
    );
  }
  const parsedUrl = new URL(dbUrl);
  if (!/(test|demo)/i.test(decodeURIComponent(parsedUrl.pathname))) {
    throw new Error(
      'Refusing to run BOM integration scenarios: database name must contain "test" or "demo".',
    );
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const prismaService = prisma as unknown as PrismaService;
  const inventory = new InventoryService(prismaService);
  const orders = new OrdersService(prismaService, inventory);
  const payments = new PaymentsService(
    prismaService,
    new MockGatewayService(),
    inventory,
  );
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  const productCode = `BOMTEST-${suffix}`;
  let fixture: BomFixture | undefined;

  const ingredientCode = (part: string) => `BOM-${part}-${suffix}`;
  const stock = async () => {
    if (!fixture) throw new Error('BOM fixture is not initialized');
    const rows = await prisma.ingredient.findMany({
      where: { id: { in: Object.values(fixture.ingredientIds) } },
    });
    return Object.fromEntries(rows.map((row) => [row.code, Number(row.currentStock)]));
  };
  const reset = async (milk = 1000, productStock = 100) => {
    if (!fixture) throw new Error('BOM fixture is not initialized');
    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: fixture.ingredientIds.COFFEE },
        data: { currentStock: 500 },
      }),
      prisma.ingredient.update({
        where: { id: fixture.ingredientIds.MILK },
        data: { currentStock: milk },
      }),
      prisma.ingredient.update({
        where: { id: fixture.ingredientIds.SUGAR },
        data: { currentStock: 200 },
      }),
      prisma.product.update({
        where: { id: fixture.productId },
        data: { stockQuantity: productStock, isAvailable: true },
      }),
    ]);
  };

  try {
    await prisma.$connect();
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: `bom-${suffix.toLowerCase()}@integration.test`,
          fullName: 'BOM PostgreSQL Integration',
          passwordHash: 'not-used-by-integration-test',
          role: Role.CUSTOMER,
        },
      });
      const product = await tx.product.create({
        data: {
          code: productCode,
          name: 'BOM integration coffee',
          description: 'Disposable product for the BOM PostgreSQL integration suite',
          basePrice: 30000,
          imageUrl: '/img/integration-test.jpg',
          category: 'Coffee',
          stockQuantity: 100,
        },
      });
      const ingredientIds: BomFixture['ingredientIds'] = {
        COFFEE: '',
        MILK: '',
        SUGAR: '',
      };
      for (const item of REGULAR_RECIPE) {
        const ingredient = await tx.ingredient.create({
          data: {
            code: ingredientCode(item.codeSuffix),
            name: `Test ${item.codeSuffix.toLowerCase()}`,
            unit: item.codeSuffix === 'MILK' ? 'ml' : 'g',
            currentStock:
              item.codeSuffix === 'COFFEE'
                ? 500
                : item.codeSuffix === 'MILK'
                  ? 1000
                  : 200,
            baselineStock:
              item.codeSuffix === 'COFFEE'
                ? 500
                : item.codeSuffix === 'MILK'
                  ? 1000
                  : 200,
            minThreshold: 0,
            category: 'Integration Test',
          },
        });
        ingredientIds[item.codeSuffix] = ingredient.id;
        await tx.productRecipe.create({
          data: {
            productCode,
            ingredientId: ingredient.id,
            size: RecipeSize.REGULAR,
            amount: item.amount,
          },
        });
      }
      fixture = {
        userId: user.id,
        productId: product.id,
        productCode,
        ingredientIds,
      };
    });
    if (!fixture) throw new Error('BOM fixture was not created');
    const activeFixture = fixture;

    console.log('[BOM PG] 20 orders succeed; the 21st is rejected transactionally');
    for (let cup = 1; cup <= 20; cup += 1) {
      await orders.createOrder(
        activeFixture.userId,
        testOrder(activeFixture, `bom-${suffix}-cup-${cup}`),
      );
    }
    assert.deepEqual(await stock(), {
      [ingredientCode('COFFEE')]: 300,
      [ingredientCode('MILK')]: 0,
      [ingredientCode('SUGAR')]: 100,
    });
    await assert.rejects(
      orders.createOrder(
        activeFixture.userId,
        testOrder(activeFixture, `bom-${suffix}-cup-21`),
      ),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(
          (error.getResponse() as { errorCode?: string }).errorCode,
          'OUT_OF_STOCK_INGREDIENT',
        );
        return true;
      },
    );
    assert.equal(
      await prisma.product.findUniqueOrThrow({ where: { id: activeFixture.productId } }).then(
        (product) => product.stockQuantity,
      ),
      80,
      'the failed 21st order must roll back the finished-product decrement',
    );
    assert.equal(
      await prisma.order.count({ where: { userId: activeFixture.userId } }),
      20,
      'the failed 21st order must not be persisted',
    );

    console.log('[BOM PG] inventory and movement rows roll back with their transaction');
    await reset();
    const movementsBeforeRollback = await prisma.inventoryMovement.count({
      where: { ingredientId: { in: Object.values(activeFixture.ingredientIds) } },
    });
    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await inventory.deductRecipe(
          activeFixture.productCode,
          RecipeSize.REGULAR,
          1,
          tx,
        );
        throw new Error('force transaction rollback');
      }),
      /force transaction rollback/,
    );
    assert.deepEqual(await stock(), {
      [ingredientCode('COFFEE')]: 500,
      [ingredientCode('MILK')]: 1000,
      [ingredientCode('SUGAR')]: 200,
    });
    assert.equal(
      await prisma.inventoryMovement.count({
        where: { ingredientId: { in: Object.values(activeFixture.ingredientIds) } },
      }),
      movementsBeforeRollback,
    );

    console.log('[BOM PG] concurrent orders cannot oversell the final cup');
    await reset(50, 2);
    const concurrentResults = await Promise.allSettled([
      orders.createOrder(
        activeFixture.userId,
        testOrder(activeFixture, `bom-${suffix}-concurrent-a`),
      ),
      orders.createOrder(
        activeFixture.userId,
        testOrder(activeFixture, `bom-${suffix}-concurrent-b`),
      ),
    ]);
    assert.equal(concurrentResults.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(concurrentResults.filter((result) => result.status === 'rejected').length, 1);
    assert.deepEqual(await stock(), {
      [ingredientCode('COFFEE')]: 490,
      [ingredientCode('MILK')]: 0,
      [ingredientCode('SUGAR')]: 195,
    });
    assert.equal(
      await prisma.product.findUniqueOrThrow({ where: { id: activeFixture.productId } }).then(
        (product) => product.stockQuantity,
      ),
      1,
    );

    console.log('[BOM PG] failed payment releases BOM and SKU reservations');
    await reset();
    const order = await orders.createOrder(
      activeFixture.userId,
      testOrder(activeFixture, `bom-${suffix}-payment-failure-order`),
    );
    const payment = await payments.createPayment(
      activeFixture.userId,
      {
        orderId: order.id,
        method: PaymentMethod.E_WALLET,
        accountRef: 'bom-test-0000',
      },
      `bom-${suffix}-payment-failure`,
    );
    assert.equal(payment.status, PaymentStatus.FAILED);
    assert.equal(payment.orderStatus, 'PAYMENT_FAILED');
    assert.deepEqual(await stock(), {
      [ingredientCode('COFFEE')]: 500,
      [ingredientCode('MILK')]: 1000,
      [ingredientCode('SUGAR')]: 200,
    });
    assert.equal(
      await prisma.inventoryMovement.count({
        where: {
          ingredientId: { in: Object.values(activeFixture.ingredientIds) },
          type: InventoryMovementType.PAYMENT_FAILED,
        },
      }),
      3,
      'failed payment should append one release movement per ingredient',
    );

    const retryPayment = await payments.createPayment(
      activeFixture.userId,
      {
        orderId: order.id,
        method: PaymentMethod.E_WALLET,
        accountRef: 'bom-test-1234',
      },
      `bom-${suffix}-payment-retry`,
    );
    assert.equal(retryPayment.status, PaymentStatus.SUCCESS);
    assert.deepEqual(await stock(), {
      [ingredientCode('COFFEE')]: 490,
      [ingredientCode('MILK')]: 950,
      [ingredientCode('SUGAR')]: 195,
    });
    assert.equal(
      await prisma.inventoryMovement.count({
        where: {
          ingredientId: { in: Object.values(activeFixture.ingredientIds) },
          type: InventoryMovementType.SALE,
        },
      }),
      6,
      'retry should reserve the BOM once after the failed attempt released it',
    );

    console.log('BOM PostgreSQL integration scenarios: PASS');
  } finally {
    if (fixture) {
      await prisma.$transaction(async (tx) => {
        const orderRows = await tx.order.findMany({
          where: { userId: fixture!.userId },
          select: { id: true },
        });
        const orderIds = orderRows.map((order) => order.id);
        if (orderIds.length > 0) {
          await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        await tx.inventoryMovement.deleteMany({
          where: { ingredientId: { in: Object.values(fixture!.ingredientIds) } },
        });
        await tx.productRecipe.deleteMany({ where: { productCode: fixture!.productCode } });
        await tx.ingredient.deleteMany({
          where: { id: { in: Object.values(fixture!.ingredientIds) } },
        });
        await tx.product.deleteMany({ where: { id: fixture!.productId } });
        await tx.user.deleteMany({ where: { id: fixture!.userId } });
      });
    }
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runBomPostgresIntegration().catch((error: unknown) => {
    console.error('BOM PostgreSQL integration failed:', error);
    process.exitCode = 1;
  });
}
