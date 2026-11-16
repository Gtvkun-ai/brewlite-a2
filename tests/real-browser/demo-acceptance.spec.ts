import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'http://localhost:3101';
const evidenceDir = path.resolve('docs/evidence/demo-acceptance-2026-11-14');
const password = 'Password123!'; // Isolated local seed, never a live account.
const money = (text: string | null) => Number((text || '').replace(/\D/g, ''));
async function shot(page: Page, name: string) {
  await mkdir(path.join(evidenceDir, 'screenshots'), { recursive: true });
  const hasDialog = await page.getByRole('dialog').count();
  await page.screenshot({ path: path.join(evidenceDir, 'screenshots', `${name}.png`), fullPage: hasDialog === 0, animations: 'disabled' });
}
async function fits(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  return dimensions;
}
async function save(name: string, data: unknown, info: TestInfo) {
  const body = JSON.stringify(data, null, 2);
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(path.join(evidenceDir, `${name}.json`), body);
  await info.attach(name, { body, contentType: 'application/json' });
}
async function login(page: Page, email = 'customer@brewlite.vn', redirect = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(`http://localhost:3100${redirect}`);
}
async function salt(page: Page) {
  const products = await (await page.request.get(`${API}/products`)).json();
  const product = products.find((p: { code: string }) => p.code === 'CF-SALT');
  expect(product.isAvailable).toBe(true);
  await page.getByTestId(`product-card-${product.id}`).click();
  await expect(page.getByTestId('quick-order-modal')).toBeVisible();
  return product;
}
async function addCustomized(page: Page) {
  const product = await salt(page);
  await page.getByTestId('size-LARGE').click();
  await page.getByTestId('sugar-70').click();
  await page.getByTestId('ice-LESS').click();
  await page.getByTestId('topping-TRAN_CHAU').check();
  expect(money(await page.getByTestId('item-total-preview').textContent())).toBe(54000);
  return product;
}

test.beforeEach(async ({ page, browser }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  (info as TestInfo & { browserErrors: string[] }).browserErrors = errors;
  await info.attach('browser', { body: JSON.stringify({ version: browser.version(), headed: true, fixtureMode: false, timezone: 'Asia/Ho_Chi_Minh' }), contentType: 'application/json' });
});
test.beforeAll(async ({ request }) => {
  // Restore the fixture precondition if an interrupted prior audit left it off.
  const products = await (await request.get(`${API}/products`)).json();
  const product = products.find((entry: { code: string }) => entry.code === 'CF-SALT');
  if (product && !product.isAvailable) {
    const auth = await (await request.post(`${API}/auth/login`, { data: { email: 'admin@brewlite.vn', password } })).json();
    const restored = await request.patch(`${API}/products/${product.id}`, { headers: { Authorization: `Bearer ${auth.accessToken}` }, data: { isAvailable: true } });
    expect(restored.ok()).toBe(true);
  }
});
test.afterEach(async ({ page }, info) => {
  const errors = (info as TestInfo & { browserErrors: string[] }).browserErrors;
  await info.attach('javascript-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  if (info.status === info.expectedStatus) expect(errors).toEqual([]);
  if (info.status !== info.expectedStatus) await shot(page, `FAILED-${info.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 70)}`);
});

test('Desktop: menu, 70/50 Large topping, drawer, wallet, live order progression', async ({ page }, info) => {
  await login(page);
  const catalog = await (await page.request.get(`${API}/products`)).json();
  await expect(page.getByTestId('product-grid')).toBeVisible();
  for (const [label, category] of [['Cà phê', 'Coffee'], ['Trà & Trà sữa', 'Tea'], ['Bánh ngọt', 'Pastry']]) {
    const tab = page.getByRole('button', { name: new RegExp(`^${label}`) });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('product-grid').locator('a.card')).toHaveCount(catalog.filter((p: { category: string }) => p.category === category).length);
    await shot(page, `desktop-01-menu-${category}`);
  }
  await page.getByRole('button', { name: /^Cà phê/ }).click();
  const product = await addCustomized(page);
  await shot(page, 'desktop-02-customization-70-50-large-topping');
  await page.getByTestId('add-to-cart-btn').click();
  await expect(page.getByTestId('quick-order-modal')).toHaveCount(0);
  const drawer = page.getByTestId('cart-drawer');
  await expect(drawer).toBeVisible();
  await expect(page.getByTestId('drawer-preparation-0')).toContainText('70%');
  await expect(page.getByTestId('drawer-preparation-0')).toContainText('50%');
  expect(money(await page.getByTestId('drawer-subtotal-preview').textContent())).toBe(54000);
  await page.getByTestId('drawer-qty-increase-0').click();
  expect(money(await page.getByTestId('drawer-subtotal-preview').textContent())).toBe(108000);
  await page.getByTestId('drawer-qty-decrease-0').click();
  await shot(page, 'desktop-03-cart-drawer-54000');
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await page.reload();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('70%');
  await expect(page.locator('main')).toContainText('50%');
  await page.goto('/checkout');
  await page.getByTestId('payment-option-E_WALLET').click();
  expect(money(await page.getByTestId('cart-subtotal').textContent())).toBe(54000);
  await shot(page, 'desktop-04-wallet-checkout');
  const orderResponse = page.waitForResponse(r => r.url() === `${API}/orders` && r.request().method() === 'POST');
  const paymentResponse = page.waitForResponse(r => r.url() === `${API}/payments` && r.request().method() === 'POST');
  await page.getByTestId('checkout-submit-btn').click();
  const orderHttp = await orderResponse;
  const order = await orderHttp.json();
  const paymentHttp = await paymentResponse;
  const payment = await paymentHttp.json();
  expect(orderHttp.status()).toBe(201);
  expect(order.items[0]).toMatchObject({ productId: product.id, selectedSugar: 70, selectedIce: 'LESS', selectedSize: 'LARGE', selectedToppings: ['TRAN_CHAU'], unitPrice: '54000' });
  expect(payment.status).toBe('SUCCESS');
  expect(payment.amount).toBe('54000');
  expect(orderHttp.request().postDataJSON()).not.toHaveProperty('totalAmount');
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
  await expect(page.getByRole('heading', { name: new RegExp(order.code) })).toBeVisible();
  await expect(page.getByTestId('step-PAID')).toHaveAttribute('data-state', 'current');
  await shot(page, 'desktop-05-paid-order');
  const observed = [{ status: 'PAID', observedAt: new Date().toISOString() }];
  await page.context().setOffline(true);
  await expect(page.getByTestId('order-refresh-status')).toContainText('kết nối');
  await expect(page.getByTestId('order-detail')).toBeVisible();
  await shot(page, 'desktop-06-tracking-offline-retains-order');
  await page.context().setOffline(false);
  for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
    await expect(page.getByTestId(`step-${status}`)).toHaveAttribute('data-state', 'current', { timeout: 20_000 });
    observed.push({ status, observedAt: new Date().toISOString() });
    await shot(page, `desktop-07-status-${status}`);
  }
  await page.reload();
  await expect(page.getByTestId('step-COMPLETED')).toHaveAttribute('data-state', 'current');
  await save('desktop-flow', { order, payment, observed, createPayload: orderHttp.request().postDataJSON(), paymentPayload: paymentHttp.request().postDataJSON(), reloadedFromDatabase: true }, info);
});

test('Mobile 390px: customized drink and simulated card checkout', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await fits(page);
  await addCustomized(page);
  await fits(page);
  await shot(page, 'mobile-01-customization');
  await page.getByTestId('add-to-cart-btn').click();
  await expect(page.getByTestId('cart-drawer')).toBeVisible();
  await fits(page);
  await shot(page, 'mobile-02-drawer');
  await page.getByTestId('drawer-checkout-link').click();
  await page.getByTestId('payment-option-DOMESTIC_ATM').click();
  await fits(page);
  await shot(page, 'mobile-03-card-checkout');
  const paymentResponse = page.waitForResponse(r => r.url() === `${API}/payments` && r.request().method() === 'POST');
  await page.getByTestId('checkout-submit-btn').click();
  const payment = await (await paymentResponse).json();
  expect(payment).toMatchObject({ status: 'SUCCESS', amount: '54000', method: 'DOMESTIC_ATM' });
  await expect(page).toHaveURL(new RegExp(`/orders/${payment.orderId}$`));
  await expect(page.getByTestId('step-PAID')).toHaveAttribute('data-state', 'current');
  const overflow = await fits(page);
  await shot(page, 'mobile-04-order-detail');
  await save('mobile-flow', { payment, viewport: page.viewportSize(), overflow }, info);
});

test('Payment failure and retry: same order, fresh attempt, inventory deducted once', async ({ page }, info) => {
  await login(page);
  const product = await salt(page);
  await page.getByTestId('add-to-cart-btn').click();
  await page.getByTestId('drawer-checkout-link').click();
  await page.getByTestId('account-ref').fill('DEMO-0000');
  const firstPayment = page.waitForResponse(r => r.url() === `${API}/payments` && r.request().method() === 'POST');
  await page.getByTestId('checkout-submit-btn').click();
  const failureHttp = await firstPayment;
  const failure = await failureHttp.json();
  expect(failure.status).toBe('FAILED');
  await expect(page.getByTestId('checkout-error')).toBeVisible();
  const stockAfterFailure = (await (await page.request.get(`${API}/products/${product.id}`)).json()).stockQuantity;
  expect(stockAfterFailure).toBe(product.stockQuantity);
  await shot(page, 'retry-01-declared-failure');
  await page.getByTestId('account-ref').fill('DEMO-1234');
  const retryPayment = page.waitForResponse(r => r.url() === `${API}/payments` && r.request().method() === 'POST');
  await page.getByTestId('checkout-submit-btn').click();
  const successHttp = await retryPayment;
  const success = await successHttp.json();
  expect(success.status).toBe('SUCCESS');
  expect(success.orderId).toBe(failure.orderId);
  expect(successHttp.request().headers()['idempotency-key']).not.toBe(failureHttp.request().headers()['idempotency-key']);
  const stockAfterSuccess = (await (await page.request.get(`${API}/products/${product.id}`)).json()).stockQuantity;
  expect(stockAfterSuccess).toBe(product.stockQuantity - 1);
  await expect(page).toHaveURL(new RegExp(`/orders/${success.orderId}$`));
  await shot(page, 'retry-02-success-same-order');
  await save('payment-retry', { failure, success, stockBefore: product.stockQuantity, stockAfterFailure, stockAfterSuccess }, info);
});

test('Admin: real login, availability toggle reaches customer, new product persists', async ({ page, browser }, info) => {
  await login(page, 'admin@brewlite.vn', '/admin/products');
  await expect(page.getByTestId('admin-products-page')).toBeVisible();
  const customerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const customer = await customerContext.newPage();
  try {
  await customer.goto('/');
  await expect(customer.getByRole('heading', { name: 'Cà phê muối', exact: true })).toBeVisible();
  const toggle = page.getByTestId('admin-toggle-CF-SALT');
  // Playwright may click background tabs; explicitly switch like a real user.
  await page.bringToFront();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'admin-01-products');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await shot(page, 'admin-02-salt-unavailable');
  await customer.bringToFront();
  // A separate browser context is a separate customer session/window. Reload
  // verifies the persisted catalog independently of OS window-focus behavior.
  await customer.reload();
  const saltCard = customer.locator('a.card').filter({ has: customer.getByRole('heading', { name: 'Cà phê muối', exact: true }) });
  await expect(saltCard).toContainText('Tạm hết hàng');
  await saltCard.click();
  await expect(customer.getByTestId('add-to-cart-btn')).toBeDisabled();
  await shot(customer, 'admin-03-customer-out-of-stock');
  await customer.keyboard.press('Escape');
  await page.bringToFront();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const code = `AUD-${Date.now()}`;
  const name = `Trà sen demo ${code.slice(-5)}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await fits(page);
  await page.getByTestId('admin-add-product-btn').click();
  await page.locator('#prod-name').fill(name);
  await page.locator('#prod-cat').selectOption('Tea');
  await page.locator('#prod-code').fill(code);
  await page.locator('#prod-price').fill('42000');
  await page.locator('#prod-stock').fill('12');
  await page.locator('#prod-img').fill('/img/tradao.jpg');
  await page.locator('#prod-desc').fill('Món mới được thêm qua Chrome thật trong nghiệm thu.');
  expect(await page.locator('#prod-price').evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);
  await fits(page);
  await page.getByRole('dialog').evaluate(dialog => { dialog.scrollTop = 0; });
  await shot(page, 'admin-04-create-product-form');
  const createdResponse = page.waitForResponse(r => r.url() === `${API}/products` && r.request().method() === 'POST', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Lưu món vào thực đơn' }).click();
  const createdHttp = await createdResponse;
  const created = await createdHttp.json();
  expect(createdHttp.status()).toBe(201);
  expect(created).toMatchObject({ code, name, category: 'Tea', stockQuantity: 12, basePrice: '42000' });
  await expect(page.getByTestId(`admin-product-${code}`)).toBeVisible();
  await shot(page, 'admin-05-new-product-persisted');
  await customer.bringToFront();
  await customer.reload();
  await expect(customer.getByRole('heading', { name, exact: true })).toBeVisible();
  await shot(customer, 'admin-06-new-product-customer-menu');
  await page.reload();
  await expect(page.getByTestId(`admin-product-${code}`)).toBeVisible();
  await save('admin-flow', { created, saltAvailabilityRestored: true, survivedReload: true, customerUpdatedAfterReload: true }, info);
  } finally {
    const token = await page.evaluate(() => localStorage.getItem('brewlite_access_token')).catch(() => null);
    const catalog = await (await page.request.get(`${API}/products`)).json();
    const product = catalog.find((entry: { code: string }) => entry.code === 'CF-SALT');
    if (token && product && !product.isAvailable) {
      await page.request.patch(`${API}/products/${product.id}`, { headers: { Authorization: `Bearer ${token}` }, data: { isAvailable: true } });
    }
    await customerContext.close();
  }
});

test('Real API negatives: unauthenticated/customer admin denied, server price and option validation', async ({ page }, info) => {
  await page.goto('/admin/products');
  await expect(page.getByTestId('admin-products-page')).toHaveCount(0);
  const payload = { code: `DENIED-${Date.now()}`, name: 'Denied', description: '', basePrice: 10000, imageUrl: '/img/caphesua.jpg', category: 'Coffee', stockQuantity: 1 };
  const unauth = await page.request.post(`${API}/products`, { data: payload });
  expect(unauth.status()).toBe(401);
  await login(page, 'customer@brewlite.vn', '/admin/products');
  await expect(page.getByTestId('admin-products-page')).toHaveCount(0);
  const token = await page.evaluate(() => localStorage.getItem('brewlite_access_token'));
  const headers = { Authorization: `Bearer ${token}` };
  const forbidden = await page.request.post(`${API}/products`, { headers, data: payload });
  expect(forbidden.status()).toBe(403);
  const products = await (await page.request.get(`${API}/products`)).json();
  const item = { productId: products.find((p: { code: string }) => p.code === 'CF-SALT').id, quantity: 1, selectedSize: 'LARGE', selectedToppings: ['TRAN_CHAU'], selectedSugar: 70, selectedIce: 'LESS' };
  const tampered = await page.request.post(`${API}/orders`, { headers, data: { items: [{ ...item, price: 1 }] } });
  expect(tampered.status()).toBe(400);
  const badOptions = await page.request.post(`${API}/orders`, { headers, data: { items: [{ ...item, selectedSugar: 69 }] } });
  expect(badOptions.status()).toBe(400);
  await shot(page, 'security-01-customer-denied-admin');
  await save('real-api-negative-cases', { unauthenticatedAdmin: unauth.status(), customerAdmin: forbidden.status(), priceTampering: { status: tampered.status(), body: await tampered.json() }, invalidSugar: { status: badOptions.status(), body: await badOptions.json() } }, info);
});

test('Guest cart survives login and offline checkout never fabricates a paid order', async ({ page }, info) => {
  await page.goto('/');
  await salt(page);
  await page.getByTestId('add-to-cart-btn').click();
  await page.getByTestId('drawer-checkout-link').click();
  await expect(page.getByTestId('checkout-unauth-warning')).toBeVisible();
  await page.getByTestId('checkout-login-btn').click();
  await page.getByTestId('login-email').fill('customer@brewlite.vn');
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('http://localhost:3100/checkout');
  expect(money(await page.getByTestId('cart-subtotal').textContent())).toBe(39000);
  await page.context().setOffline(true);
  await page.getByTestId('checkout-submit-btn').click();
  await expect(page.getByTestId('checkout-error')).toContainText('Không thể kết nối');
  await expect(page.getByTestId('checkout-success-view')).toHaveCount(0);
  await expect(page).toHaveURL('http://localhost:3100/checkout');
  await shot(page, 'guest-01-offline-checkout-no-fake-payment');
  await page.context().setOffline(false);
  const paymentResponse = page.waitForResponse(r => r.url() === `${API}/payments` && r.request().method() === 'POST');
  await page.getByTestId('checkout-submit-btn').click();
  const payment = await (await paymentResponse).json();
  expect(payment.status).toBe('SUCCESS');
  await expect(page).toHaveURL(new RegExp(`/orders/${payment.orderId}$`));
  await shot(page, 'guest-02-reconnected-order-success');
  await save('guest-offline-flow', { cartPreservedAfterLogin: true, offlineShowedError: true, paymentAfterReconnect: payment }, info);
});
