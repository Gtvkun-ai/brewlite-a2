// Read-only cross-check of browser evidence against the isolated local database.
const { PrismaClient } = require('@prisma/client');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = path.resolve(__dirname, '../docs/evidence/demo-acceptance-2026-11-14');
const read = name => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://brew_demo:brewlite_demo_local@127.0.0.1:55432/brewlite_demo?schema=public' } } });
async function main() {
  const desktop = read('desktop-flow');
  const mobile = read('mobile-flow');
  const retry = read('payment-retry');
  const guest = read('guest-offline-flow');
  const admin = read('admin-flow');
  const ids = [desktop.order.id, mobile.payment.orderId, retry.success.orderId, guest.paymentAfterReconnect.orderId];
  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, code: true, status: true, totalAmount: true,
      items: { select: { productId: true, quantity: true, selectedSize: true, selectedToppings: true, selectedSugar: true, selectedIce: true, unitPrice: true, itemTotal: true } },
      payments: { select: { id: true, method: true, status: true, amount: true } },
    },
  });
  assert.equal(orders.length, 4);
  const desktopOrder = orders.find(order => order.id === desktop.order.id);
  assert.equal(desktopOrder.status, 'COMPLETED');
  assert.equal(desktopOrder.totalAmount.toString(), '54000');
  assert.equal(desktopOrder.items[0].selectedSugar, 70);
  assert.equal(desktopOrder.items[0].selectedIce, 'LESS');
  const retryOrder = orders.find(order => order.id === retry.success.orderId);
  assert.equal(retryOrder.payments.filter(payment => payment.status === 'SUCCESS').length, 1);
  assert.equal(retryOrder.payments.filter(payment => payment.status === 'FAILED').length, 1);
  const products = await prisma.product.findMany({
    where: { code: { in: ['CF-SALT', admin.created.code] } },
    select: { id: true, code: true, name: true, category: true, basePrice: true, isAvailable: true, stockQuantity: true },
  });
  assert.equal(products.find(product => product.code === 'CF-SALT').isAvailable, true);
  assert.equal(products.find(product => product.code === admin.created.code).stockQuantity, 12);
  writeFileSync(path.join(dir, 'database-verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), result: 'PASS', database: 'brewlite_demo@127.0.0.1:55432', orders, products }, null, 2));
  console.log('Database cross-check: PASS (4 browser orders, per-drink options, retry payments, availability, new product).');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
