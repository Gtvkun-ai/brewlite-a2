import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CartPage from '../app/cart/page';
import ProductDetailPage from '../app/products/[id]/page';
import CartDrawer from '../components/CartDrawer';
import CheckoutPage from '../app/checkout/page';
import * as checkoutApi from '../lib/checkout-api';
import { AuthProvider } from '../context/AuthContext';
import {
  calculateItemTotal,
  calculateUnitPrice,
  CART_KEY,
  CartProvider,
  sanitizeCartItem,
  sanitizeToppings,
  useCart,
} from '../context/CartContext';
import * as api from '../lib/api';
import { ApiError } from '../lib/api';
import type { CartItem, Product } from '../lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/cart',
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const sampleProduct: Product = {
  id: 'prod_cf_milk',
  code: 'CF-MILK',
  name: 'Cà phê sữa đá',
  description: 'Cà phê Robusta đậm đà pha phin truyền thống.',
  basePrice: '35000',
  imageUrl: '/img/caphesua.jpg',
  category: 'Coffee',
  isAvailable: true,
  stockQuantity: 10,
};

const mockParams = (id: string) =>
  ({ id }) as unknown as Promise<{ id: string }>;

describe('Role E — Product Options & Cart Management (WEB-T02 & WEB-T03)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe('WEB-T02: Pricing Formula & Input Validation Helpers', () => {
    it('calculates unitPrice and itemTotal accurately for Regular/Large and toppings', () => {
      // Regular (+0) without toppings
      expect(calculateUnitPrice('35000', 'REGULAR', [])).toBe(35000);

      // Large (+10,000) without toppings
      expect(calculateUnitPrice('35000', 'LARGE', [])).toBe(45000);

      // Large (+10,000) + TRAN_CHAU (+5,000) + KEM_CHEESE (+10,000) + THACH_DAO (+7,000)
      const fullUnit = calculateUnitPrice('35000', 'LARGE', [
        'TRAN_CHAU',
        'KEM_CHEESE',
        'THACH_DAO',
      ]);
      expect(fullUnit).toBe(67000);
      expect(calculateItemTotal(fullUnit, 3)).toBe(201000);
    });

    it('sanitizes toppings and rejects invalid CartItem configurations', () => {
      // Deduplicates, sorts, and removes invalid topping codes (e.g., notes accidentally put in toppings)
      expect(
        sanitizeToppings(['THACH_DAO', 'INVALID_NOTE', 'TRAN_CHAU', 'THACH_DAO']),
      ).toEqual(['THACH_DAO', 'TRAN_CHAU']);

      // Rejects non-positive quantity, invalid size, or missing productId
      expect(
        sanitizeCartItem({
          productId: 'p1',
          name: 'Test',
          basePrice: '35000',
          size: 'REGULAR',
          toppings: [],
          quantity: 0,
          unitPrice: '35000',
          itemTotal: '0',
        }),
      ).toBeNull();

      expect(
        sanitizeCartItem({
          productId: 'p1',
          name: 'Test',
          basePrice: '35000',
          size: 'EXTRA_LARGE' as unknown as 'LARGE',
          toppings: [],
          quantity: 1,
          unitPrice: '35000',
          itemTotal: '35000',
        }),
      ).toBeNull();

      // Recalculates authoritative preview unitPrice and itemTotal
      const valid = sanitizeCartItem({
        productId: 'prod_cf_milk',
        name: 'Cà phê sữa đá',
        basePrice: '35000',
        size: 'LARGE',
        toppings: ['KEM_CHEESE'],
        quantity: 2,
        unitPrice: '1', // Tampered client price is recalculated from basePrice + surcharges
        itemTotal: '2',
      });
      expect(valid).not.toBeNull();
      expect(valid?.unitPrice).toBe('55000'); // 35000 + 10000 + 10000
      expect(valid?.itemTotal).toBe('110000');
    });
  });

  describe('WEB-T02 & NFR-03: Product Detail Page States & Live Option Pricing', () => {
    it('renders Loading state before product fetch resolves', async () => {
      let resolveProduct: ((p: Product) => void) | undefined;
      vi.spyOn(api, 'fetchProduct').mockReturnValueOnce(
        new Promise<Product>((r) => {
          resolveProduct = r;
        }),
      );

      render(
        <CartProvider>
          <ProductDetailPage params={mockParams('prod_cf_milk')} />
        </CartProvider>,
      );

      expect(screen.getByText('Loading product…')).toBeInTheDocument();

      resolveProduct?.(sampleProduct);
      expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();
    });

    it('renders Error state and retries successfully when clicking Retry', async () => {
      const fetchSpy = vi
        .spyOn(api, 'fetchProduct')
        .mockRejectedValueOnce(new Error('Network down'));

      render(
        <CartProvider>
          <ProductDetailPage params={mockParams('prod_cf_milk')} />
        </CartProvider>,
      );

      expect(
        await screen.findByText("We couldn't load this product."),
      ).toBeInTheDocument();

      fetchSpy.mockResolvedValueOnce(sampleProduct);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('renders Not Found state when API returns 404', async () => {
      vi.spyOn(api, 'fetchProduct').mockRejectedValueOnce(
        new ApiError(404, 'Not found'),
      );

      render(
        <CartProvider>
          <ProductDetailPage params={mockParams('missing_id')} />
        </CartProvider>,
      );

      expect(await screen.findByText('Product not found')).toBeInTheDocument();
    });

    it('recalculates price immediately on size, topping, and quantity changes and adds to cart', async () => {
      vi.spyOn(api, 'fetchProduct').mockResolvedValueOnce(sampleProduct);

      render(
        <CartProvider>
          <ProductDetailPage params={mockParams('prod_cf_milk')} />
          <CartPage />
        </CartProvider>,
      );

      expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();

      // Initial state: REGULAR (+0), no toppings, quantity 1 -> 35.000 ₫
      expect(screen.getByTestId('unit-price-preview')).toHaveTextContent('35.000');
      expect(screen.getByTestId('item-total-preview')).toHaveTextContent('35.000');

      // Switch to LARGE (+10.000 ₫) -> 45.000 ₫
      fireEvent.click(screen.getByTestId('size-LARGE'));
      expect(screen.getByTestId('unit-price-preview')).toHaveTextContent('45.000');
      expect(screen.getByTestId('item-total-preview')).toHaveTextContent('45.000');

      // Toggle TRAN_CHAU (+5.000 ₫) and KEM_CHEESE (+10.000 ₫) -> 60.000 ₫
      fireEvent.click(screen.getByTestId('topping-TRAN_CHAU'));
      fireEvent.click(screen.getByTestId('topping-KEM_CHEESE'));
      expect(screen.getByTestId('unit-price-preview')).toHaveTextContent('60.000');

      // Increase quantity to 2 -> itemTotal = 120.000 ₫
      fireEvent.click(screen.getByTestId('qty-increase'));
      expect(screen.getByTestId('qty-value')).toHaveTextContent('2');
      expect(screen.getByTestId('item-total-preview')).toHaveTextContent('120.000');

      // Enter note
      fireEvent.change(screen.getByTestId('product-note'), {
        target: { value: 'Ít đá, giao bàn 3' },
      });

      // Add to cart
      fireEvent.click(screen.getByTestId('add-to-cart-btn'));

      expect(await screen.findByTestId('added-to-cart-feedback')).toBeInTheDocument();

      // Verify CartPage reflects the added item and note
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent(
        '120.000',
      );
      expect(screen.getByTestId('cart-delivery-note')).toHaveValue(
        'Ít đá, giao bàn 3',
      );
    });

    it('disables Add to Cart when product is out of stock', async () => {
      vi.spyOn(api, 'fetchProduct').mockResolvedValueOnce({
        ...sampleProduct,
        isAvailable: false,
        stockQuantity: 0,
      });

      render(
        <CartProvider>
          <ProductDetailPage params={mockParams('prod_cf_milk')} />
        </CartProvider>,
      );

      expect(await screen.findByTestId('out-of-stock-badge')).toBeInTheDocument();
      const addBtn = screen.getByTestId('add-to-cart-btn');
      expect(addBtn).toBeDisabled();
      expect(addBtn).toHaveTextContent('Tạm hết hàng');
    });
  });

  describe('WEB-T03: Cart Merging, Splitting, Quantity Update, Clear & Payload Handoff', () => {
    function CartTestHarness() {
      const {
        addItem,
        getOrderItemsPayload,
        toCreateOrderRequest,
        openDrawer,
      } = useCart();

      const addSameConfig = () =>
        addItem({
          productId: 'prod_cf_milk',
          name: 'Cà phê sữa đá',
          basePrice: '35000',
          size: 'LARGE',
          // Pass toppings in reverse order to verify canonical sorting & merging
          toppings: ['THACH_DAO', 'TRAN_CHAU'],
          quantity: 1,
          unitPrice: '57000',
          itemTotal: '57000',
        });

      const addSameConfigAgain = () =>
        addItem({
          productId: 'prod_cf_milk',
          name: 'Cà phê sữa đá',
          basePrice: '35000',
          size: 'LARGE',
          toppings: ['TRAN_CHAU', 'THACH_DAO'],
          quantity: 2,
          unitPrice: '57000',
          itemTotal: '114000',
        });

      const addDifferentConfig = () =>
        addItem({
          productId: 'prod_cf_milk',
          name: 'Cà phê sữa đá',
          basePrice: '35000',
          size: 'REGULAR',
          toppings: [],
          quantity: 1,
          unitPrice: '35000',
          itemTotal: '35000',
        });

      const addInvalidItem = () =>
        addItem({
          productId: 'prod_cf_milk',
          name: 'Cà phê sữa đá',
          basePrice: '35000',
          size: 'REGULAR',
          toppings: [],
          quantity: -5,
          unitPrice: '35000',
          itemTotal: '-175000',
        });

      const payloadJson = JSON.stringify(getOrderItemsPayload());
      const requestJson = JSON.stringify(toCreateOrderRequest());

      return (
        <div>
          <button
            type="button"
            onClick={addSameConfig}
            data-testid="harness-add-1"
          >
            Add 1
          </button>
          <button
            type="button"
            onClick={addSameConfigAgain}
            data-testid="harness-add-2"
          >
            Add 2 Same
          </button>
          <button
            type="button"
            onClick={addDifferentConfig}
            data-testid="harness-add-diff"
          >
            Add Diff
          </button>
          <button
            type="button"
            onClick={addInvalidItem}
            data-testid="harness-add-invalid"
          >
            Add Invalid
          </button>
          <button
            type="button"
            onClick={openDrawer}
            data-testid="harness-open-drawer"
          >
            Open Drawer
          </button>
          <pre data-testid="handoff-items-payload">{payloadJson}</pre>
          <pre data-testid="handoff-order-request">{requestJson}</pre>
          <CartPage />
          <CartDrawer />
        </div>
      );
    }

    it('merges items with identical configuration and separates different configurations', async () => {
      render(
        <CartProvider>
          <CartTestHarness />
        </CartProvider>,
      );

      // Initially empty cart
      expect(screen.getByTestId('cart-empty-state')).toBeInTheDocument();

      // Add 1st item (LARGE + TRAN_CHAU, THACH_DAO = 35000 + 10000 + 5000 + 7000 = 57000)
      fireEvent.click(screen.getByTestId('harness-add-1'));
      expect(screen.getAllByTestId('cart-item')).toHaveLength(1);
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('1');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('57.000');

      // Add 2 more of the SAME configuration -> merges into 1 line with quantity 3 (171.000 ₫)
      fireEvent.click(screen.getByTestId('harness-add-2'));
      expect(screen.getAllByTestId('cart-item')).toHaveLength(1);
      expect(screen.getByTestId('cart-qty-value-0')).toHaveTextContent('3');
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('3');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('171.000');

      // Add DIFFERENT configuration (REGULAR, no toppings = 35.000 ₫) -> separates into 2nd line
      fireEvent.click(screen.getByTestId('harness-add-diff'));
      expect(screen.getAllByTestId('cart-item')).toHaveLength(2);
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('4');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('206.000');

      // Invalid item (quantity -5) is safely ignored
      fireEvent.click(screen.getByTestId('harness-add-invalid'));
      expect(screen.getAllByTestId('cart-item')).toHaveLength(2);
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('4');
    });

    it('supports quantity increase/decrease, option changes in cart, single item removal, and clearCart', async () => {
      render(
        <CartProvider>
          <CartTestHarness />
        </CartProvider>,
      );

      fireEvent.click(screen.getByTestId('harness-add-1')); // Line 0: LARGE + TRAN_CHAU, THACH_DAO (57.000)
      fireEvent.click(screen.getByTestId('harness-add-diff')); // Line 1: REGULAR (35.000)

      // Increase Line 1 quantity from 1 -> 2 (Subtotal: 57.000 + 70.000 = 127.000)
      fireEvent.click(screen.getByTestId('cart-qty-increase-1'));
      expect(screen.getByTestId('cart-qty-value-1')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('127.000');

      // Change Line 1 size from REGULAR -> LARGE (+10.000 each -> 45.000 * 2 = 90.000; Subtotal = 147.000)
      fireEvent.change(screen.getByTestId('cart-size-select-1'), {
        target: { value: 'LARGE' },
      });
      expect(screen.getByTestId('cart-item-total-1')).toHaveTextContent('90.000');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('147.000');

      // Decrease Line 0 quantity from 1 -> 0 removes Line 0 automatically
      fireEvent.click(screen.getByTestId('cart-qty-decrease-0'));
      expect(screen.getAllByTestId('cart-item')).toHaveLength(1);
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('90.000');

      // Clear entire cart
      fireEvent.click(screen.getByTestId('cart-clear-btn'));
      expect(screen.getByTestId('cart-empty-state')).toBeInTheDocument();
    });

    it('produces clean Role F handoff payload without client prices and handles corrupted localStorage', async () => {
      // Seed corrupted JSON into localStorage before mount
      localStorage.setItem(CART_KEY, '{corrupted-json');

      render(
        <CartProvider>
          <CartTestHarness />
        </CartProvider>,
      );

      // Recovers to empty state without crashing
      expect(screen.getByTestId('cart-empty-state')).toBeInTheDocument();

      // Add item and delivery note
      fireEvent.click(screen.getByTestId('harness-add-1'));
      fireEvent.change(screen.getByTestId('cart-delivery-note'), {
        target: { value: 'Giao cổng chính' },
      });

      const itemsPayload = JSON.parse(
        screen.getByTestId('handoff-items-payload').textContent || '[]',
      );
      expect(itemsPayload).toEqual([
        {
          productId: 'prod_cf_milk',
          quantity: 1,
          selectedSize: 'LARGE',
          selectedToppings: ['THACH_DAO', 'TRAN_CHAU'],
          selectedSugar: 100,
          selectedIce: 'NORMAL',
        },
      ]);
      // Confirm no client price fields leak into order DTO payload
      expect(itemsPayload[0]).not.toHaveProperty('unitPrice');
      expect(itemsPayload[0]).not.toHaveProperty('itemTotal');
      expect(itemsPayload[0]).not.toHaveProperty('basePrice');

      const orderReq = JSON.parse(
        screen.getByTestId('handoff-order-request').textContent || '{}',
      );
      expect(orderReq.deliveryNote).toBe('Giao cổng chính');

      // Open CartDrawer and verify drawer interaction
      fireEvent.click(screen.getByTestId('harness-open-drawer'));
      expect(await screen.findByTestId('cart-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-total-count')).toHaveTextContent('1 món');

      fireEvent.click(screen.getByTestId('cart-drawer-close'));
      await waitFor(() => {
        expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
      });
    });
  });

  describe('E-20 (Sprint 2): Cart-Checkout Integration, Stale Price/Stock Sync & Regression Flow', () => {
    it('syncWithCatalog updates stale prices and removes out-of-stock items', () => {
      let syncResult: ReturnType<ReturnType<typeof useCart>['syncWithCatalog']> | undefined;

      function SyncHarness() {
        const { addItem, items, syncWithCatalog } = useCart();

        React.useEffect(() => {
          addItem({
            productId: 'p_coffee',
            name: 'Cà phê sữa',
            basePrice: '30000',
            size: 'LARGE',
            toppings: ['TRAN_CHAU'],
            quantity: 2,
            unitPrice: '45000', // 30000 + 10000 + 5000
            itemTotal: '90000',
          });

          addItem({
            productId: 'p_discontinued',
            name: 'Món ngừng bán',
            basePrice: '20000',
            size: 'REGULAR',
            toppings: [],
            quantity: 1,
            unitPrice: '20000',
            itemTotal: '20000',
          });
        }, [addItem]);

        return (
          <div>
            <button
              data-testid="btn-sync"
              onClick={() => {
                syncResult = syncWithCatalog([
                  {
                    id: 'p_coffee',
                    basePrice: '35000', // Price increased from 30000 -> 35000
                    isAvailable: true,
                    stockQuantity: 50,
                  },
                  {
                    id: 'p_discontinued',
                    basePrice: '20000',
                    isAvailable: false, // Out of stock
                    stockQuantity: 0,
                  },
                ]);
              }}
            >
              Sync
            </button>
            <span data-testid="sync-items-count">{items.length}</span>
            {items.map((it, i) => (
              <span key={i} data-testid={`sync-item-total-${i}`}>
                {it.itemTotal}
              </span>
            ))}
          </div>
        );
      }

      render(
        <CartProvider>
          <SyncHarness />
        </CartProvider>,
      );

      expect(screen.getByTestId('sync-items-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByTestId('btn-sync'));

      // Out of stock item removed: length is now 1
      expect(screen.getByTestId('sync-items-count')).toHaveTextContent('1');
      expect(syncResult?.updated).toBe(true);
      expect(syncResult?.priceChangedItems).toHaveLength(1);
      expect(syncResult?.outOfStockItems).toHaveLength(1);

      // Price recalculated: 35000 (new base) + 10000 (LARGE) + 5000 (TRAN_CHAU) = 50000 * 2 = 100000
      expect(screen.getByTestId('sync-item-total-0')).toHaveTextContent('100000');
    });

    it('E-20 Acceptance: chọn Large+topping → checkout có cùng cấu hình, lỗi payment giữ giỏ, success clear đúng một lần', async () => {
      // Mock authenticated customer
      localStorage.setItem('brewlite_access_token', 'jwt-e20-token');
      localStorage.setItem(
        'brewlite_user',
        JSON.stringify({
          id: 'usr_e20',
          email: 'customer@brewlite.vn',
          fullName: 'Khách hàng E20',
          role: 'CUSTOMER',
        }),
      );

      vi.spyOn(api, 'fetchProduct').mockResolvedValueOnce(sampleProduct);

      function FullFlowApp() {
        return (
          <AuthProvider>
            <CartProvider>
              <ProductDetailPage params={mockParams('prod_cf_milk')} />
              <CartPage />
              <CheckoutPage />
            </CartProvider>
          </AuthProvider>
        );
      }

      render(<FullFlowApp />);

      // 1. User configures product on Detail Page: LARGE + TRAN_CHAU, Qty 2, Note "Giao cổng 2"
      expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('size-LARGE'));
      fireEvent.click(screen.getByTestId('topping-TRAN_CHAU'));
      fireEvent.click(screen.getByTestId('qty-increase')); // 1 -> 2
      fireEvent.change(screen.getByTestId('product-note'), {
        target: { value: 'Giao cổng 2' },
      });

      // Add to cart
      fireEvent.click(screen.getByTestId('add-to-cart-btn'));
      expect(await screen.findByTestId('added-to-cart-feedback')).toBeInTheDocument();

      // 2. Verify Cart Page displays the item with exact configuration
      expect(screen.getByTestId('cart-total-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal-preview')).toHaveTextContent('100.000');
      expect(screen.getByTestId('cart-delivery-note')).toHaveValue('Giao cổng 2');

      // 3. Verify Checkout Page receives the identical configuration and note
      expect(screen.getByTestId('delivery-note')).toHaveValue('Giao cổng 2');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('100.000');
      const checkoutItem = screen.getByTestId('checkout-item');
      expect(checkoutItem).toHaveTextContent('Cà phê sữa đá');
      expect(checkoutItem).toHaveTextContent('Size: LARGE');
      expect(checkoutItem).toHaveTextContent('TRAN_CHAU');

      // 4. STEP 4: First attempt fails (e.g. payment error)
      const mockCreateOrder = vi
        .spyOn(checkoutApi, 'createOrderApi')
        .mockResolvedValueOnce({
          id: 'ord_e20_01',
          code: 'BL-E20-FAIL',
          status: 'PENDING',
          subTotal: '100000',
          discountAmount: '0',
          totalAmount: '100000',
          createdAt: new Date().toISOString(),
          items: [],
        });

      const mockSubmitPayment = vi
        .spyOn(checkoutApi, 'submitPaymentApi')
        .mockResolvedValueOnce({
          paymentId: 'pay_fail_e20',
          orderId: 'ord_e20_01',
          status: 'FAILED',
          orderStatus: 'PAYMENT_FAILED',
          amount: '100000',
          method: 'E_WALLET',
          message: 'Tài khoản không đủ số dư để thanh toán.',
        });

      const submitBtn = screen.getByTestId('checkout-submit-btn');
      fireEvent.click(submitBtn);

      // Verify payment error banner is shown
      expect(await screen.findByTestId('checkout-error')).toHaveTextContent(
        'Tài khoản không đủ số dư',
      );

      // CRITICAL ACCEPTANCE: Cart is KEPT!
      expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByTestId('checkout-submit-btn')).toHaveTextContent(
        'Thử lại thanh toán',
      );

      // 5. STEP 5: Second attempt succeeds (Retry payment)
      mockSubmitPayment.mockResolvedValueOnce({
        paymentId: 'pay_success_e20',
        orderId: 'ord_e20_01',
        status: 'SUCCESS',
        orderStatus: 'PAID',
        amount: '100000',
        method: 'DOMESTIC_ATM',
        transactionRef: 'TX_E20_SUCCESS',
      });

      // Switch payment method and click retry
      fireEvent.click(screen.getByTestId('payment-option-DOMESTIC_ATM'));
      fireEvent.click(screen.getByTestId('checkout-submit-btn'));

      // Verify success screen is displayed
      expect(await screen.findByTestId('checkout-success-view')).toBeInTheDocument();
      expect(screen.getByTestId('order-code')).toHaveTextContent('#BL-E20-FAIL');

      // CRITICAL ACCEPTANCE: Cart is CLEARED after successful payment!
      await waitFor(() => {
        expect(localStorage.getItem(CART_KEY)).toBe('[]');
      });
      expect(mockCreateOrder).toHaveBeenCalledTimes(1); // Never recreated order on retry
      expect(mockSubmitPayment).toHaveBeenCalledTimes(2);
    });
  });
});

