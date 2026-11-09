import { expect, test } from '@playwright/test';
import { E2E_FAIL_ACCOUNT_REF, E2E_USER } from './test-data';

// Nhóm 1: chạy được ngay bằng dữ liệu mẫu (fixture), không cần API thật.
test.describe('Orders UI (fixture mode)', () => {
  test('TC-01: order history lists fixture orders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Order history' })).toBeVisible();
    await expect(page.getByTestId('fixture-banner')).toBeVisible();
    await expect(page.getByRole('link', { name: '#FX-20261106-001' })).toBeVisible();
  });

  test('TC-03: order detail shows stepper at the current step', async ({ page }) => {
    await page.goto('/orders');
    await page.getByRole('link', { name: '#FX-20261106-001' }).click();
    await expect(page).toHaveURL(/\/orders\/fx-1001$/);
    await expect(page.getByTestId('step-PREPARING')).toHaveAttribute('data-state', 'current');
    await expect(page.getByTestId('step-PAID')).toHaveAttribute('data-state', 'done');
  });

  test('TC-05: PAYMENT_FAILED order shows a terminal state', async ({ page }) => {
    await page.goto('/orders/fx-1003');
    await expect(page.getByTestId('order-terminal-state')).toBeVisible();
    await expect(page.getByTestId('step-PAID')).toHaveCount(0);
  });

  test('unknown order shows not-found with Retry', async ({ page }) => {
    await page.goto('/orders/abc');
    await expect(page.getByText('Order not found.')).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});

// Nhóm 2: dữ liệu test tách biệt khỏi seed.
test('test data is isolated from demo seed accounts', () => {
  expect(E2E_USER.email).not.toBe('customer@brewlite.vn');
  expect(E2E_FAIL_ACCOUNT_REF.endsWith('0000')).toBe(true);
});

// Nhóm 3: chờ API Sprint 2. Đánh dấu fixme, KHÔNG tính là pass.
test.describe('Checkout flow (chờ API thật)', () => {
  test.fixme('TC-10: happy path – giỏ hàng -> tạo đơn -> thanh toán -> PAID', async () => {});
  test.fixme('TC-11: payment failure – accountRef kết thúc 0000', async () => {});
  test.fixme('TC-12: retry – cùng Idempotency-Key không tạo đơn trùng', async () => {});
  test.fixme('TC-15: hết hàng – OUT_OF_STOCK', async () => {});
  test.fixme('TC-16: unauthorized – chưa đăng nhập vào /orders', async () => {});
  test.fixme('TC-08: xem đơn của user khác – 403 ORDER_ACCESS_DENIED', async () => {});
});