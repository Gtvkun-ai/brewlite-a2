import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import CheckoutPage from '../app/checkout/page';
import * as checkoutApi from '../lib/checkout-api';
import { ApiError } from '../lib/api';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
  usePathname: () => '/checkout',
}));

describe('CheckoutPage (Role F - S1 & S2)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockReset();
    vi.restoreAllMocks();
    vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'true');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  function setAuthenticatedUser() {
    localStorage.setItem('brewlite_access_token', 'test-jwt-token');
    localStorage.setItem(
      'brewlite_user',
      JSON.stringify({
        id: 'usr_f_01',
        email: 'customer@brewlite.vn',
        fullName: 'Nguyễn Văn F',
        role: 'CUSTOMER',
      }),
    );
  }

  function CartSeed({
    children,
    initialItems,
  }: {
    children: React.ReactNode;
    initialItems?: boolean;
  }) {
    const { addItem } = useCart();
    React.useEffect(() => {
      if (initialItems) {
        addItem({
          productId: 'p_coffee_01',
          name: 'Cà phê Sữa Đá',
          basePrice: '35000',
          size: 'LARGE',
          toppings: ['TRAN_CHAU'],
          quantity: 2,
          unitPrice: '50000',
          itemTotal: '100000',
        });
      }
    }, [addItem, initialItems]);
    return <>{children}</>;
  }

  function renderCheckout(options: { authenticated?: boolean; withCart?: boolean } = {}) {
    if (options.authenticated) {
      setAuthenticatedUser();
    }
    return render(
      <AuthProvider>
        <CartProvider>
          <CartSeed initialItems={options.withCart}>
            <CheckoutPage />
          </CartSeed>
        </CartProvider>
      </AuthProvider>,
    );
  }

  describe('Pre-condition Guards (Sprint 1)', () => {
    it('blocks unauthenticated user with warning and login button', async () => {
      renderCheckout({ authenticated: false, withCart: true });

      expect(await screen.findByTestId('checkout-unauth-warning')).toBeInTheDocument();
      expect(screen.getByTestId('checkout-login-btn')).toBeInTheDocument();
      expect(screen.getByText(/Yêu cầu đăng nhập/i)).toBeInTheDocument();
    });

    it('displays empty state when cart is empty', async () => {
      renderCheckout({ authenticated: true, withCart: false });

      expect(await screen.findByTestId('checkout-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Giỏ hàng của bạn đang trống/i)).toBeInTheDocument();
      expect(screen.getByTestId('load-fixture-btn')).toBeInTheDocument();
    });

    it('hides fixture seeding controls in real API mode', async () => {
      vi.stubEnv('NEXT_PUBLIC_USE_FIXTURES', 'false');
      renderCheckout({ authenticated: true, withCart: false });
      expect(await screen.findByTestId('checkout-empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('load-fixture-btn')).not.toBeInTheDocument();
    });

    it('loads fixture cart when clicking "Nạp giỏ hàng mẫu để kiểm thử"', async () => {
      renderCheckout({ authenticated: true, withCart: false });

      const loadBtn = await screen.findByTestId('load-fixture-btn');
      fireEvent.click(loadBtn);

      expect(await screen.findByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByText(/Cà phê sữa đá/i)).toBeInTheDocument();
    });
  });

  describe('Order & Payment Orchestration (Sprint 1 & Sprint 2)', () => {
    it('renders cart summary, delivery note, and payment options', async () => {
      renderCheckout({ authenticated: true, withCart: true });

      expect(await screen.findByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByText(/Cà phê Sữa Đá/i)).toBeInTheDocument();
      expect(screen.getByTestId('delivery-note')).toBeInTheDocument();
      expect(screen.getByTestId('payment-option-E_WALLET')).toBeInTheDocument();
      expect(screen.getByTestId('payment-option-DOMESTIC_ATM')).toBeInTheDocument();
      expect(screen.getByTestId('checkout-submit-btn')).toHaveTextContent(
        'Xác nhận thanh toán',
      );
    });

    it('orchestrates 2-step checkout: POST /orders then POST /payments with Idempotency-Key', async () => {
      const mockCreateOrder = vi
        .spyOn(checkoutApi, 'createOrderApi')
        .mockResolvedValueOnce({
          id: 'ord_12345',
          code: 'BL-9999',
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
          paymentId: 'pay_12345',
          orderId: 'ord_12345',
          status: 'SUCCESS',
          orderStatus: 'PAID',
          amount: '100000',
          method: 'E_WALLET',
          transactionRef: 'TX_778899',
        });

      renderCheckout({ authenticated: true, withCart: true });

      await screen.findByTestId('cart-summary');
      fireEvent.change(screen.getByTestId('delivery-note'), {
        target: { value: 'Giao trước 11h' },
      });

      const submitBtn = screen.getByTestId('checkout-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalledTimes(1);
      });

      // Verify payload passed to createOrderApi
      expect(mockCreateOrder).toHaveBeenCalledWith(
        {
          deliveryNote: 'Giao trước 11h',
          items: [
            {
              productId: 'p_coffee_01',
              quantity: 2,
              selectedSize: 'LARGE',
              selectedToppings: ['TRAN_CHAU'],
              selectedSugar: 100,
              selectedIce: 'NORMAL',
            },
          ],
        },
        'test-jwt-token',
        expect.stringMatching(/^order:/),
      );

      await waitFor(() => {
        expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
      });

      // Verify server-authoritative payment request: amount is NOT sent
      const paymentCallArgs = mockSubmitPayment.mock.calls[0];
      expect(paymentCallArgs[0]).toEqual({
        orderId: 'ord_12345',
        method: 'E_WALLET',
        accountRef: 'DEMO-E_WALLET-1234',
      });
      // Verify idempotencyKey is non-empty string
      expect(typeof paymentCallArgs[1]).toBe('string');
      expect(paymentCallArgs[1].length).toBeGreaterThan(10);
      expect(paymentCallArgs[2]).toBe('test-jwt-token');

      // Success view displayed with order details and links
      expect(await screen.findByTestId('checkout-success-view')).toBeInTheDocument();
      expect(screen.getByTestId('order-code')).toHaveTextContent('#BL-9999');
      expect(screen.getByTestId('transaction-ref')).toHaveTextContent('TX_778899');
      expect(screen.getByTestId('view-order-btn')).toHaveAttribute('href', '/orders/ord_12345');
      expect(screen.getByTestId('view-history-btn')).toHaveAttribute('href', '/orders');
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/orders/ord_12345'), { timeout: 2500 });
    });

    it('prevents double-submit when user clicks repeatedly', async () => {
      let resolvePayment: ((value: any) => void) | undefined;
      vi.spyOn(checkoutApi, 'createOrderApi').mockResolvedValueOnce({
        id: 'ord_double',
        code: 'BL-8888',
        status: 'PENDING',
        subTotal: '100000',
        discountAmount: '0',
        totalAmount: '100000',
        createdAt: new Date().toISOString(),
        items: [],
      });

      const mockSubmitPayment = vi
        .spyOn(checkoutApi, 'submitPaymentApi')
        .mockReturnValueOnce(
          new Promise((r) => {
            resolvePayment = r;
          }),
        );

      renderCheckout({ authenticated: true, withCart: true });

      const submitBtn = await screen.findByTestId('checkout-submit-btn');

      // Click first time
      fireEvent.click(submitBtn);

      // Button should be disabled during submit
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveTextContent('Đang xử lý đơn hàng…');

      // Click second time while pending
      fireEvent.click(submitBtn);

      // Resolve the payment
      resolvePayment?.({
        paymentId: 'pay_double',
        orderId: 'ord_double',
        status: 'SUCCESS',
        orderStatus: 'PAID',
        amount: '100000',
        method: 'E_WALLET',
        transactionRef: 'TX_111111',
      });

      await waitFor(() => {
        expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
      });
    });

    it('handles payment decline/failure: preserves cart and retries the same order with a new payment attempt key', async () => {
      const mockCreateOrder = vi
        .spyOn(checkoutApi, 'createOrderApi')
        .mockResolvedValueOnce({
          id: 'ord_retry_01',
          code: 'BL-RETRY',
          status: 'PENDING',
          subTotal: '100000',
          discountAmount: '0',
          totalAmount: '100000',
          createdAt: new Date().toISOString(),
          items: [],
        });

      // 1st attempt: Payment fails
      const mockSubmitPayment = vi
        .spyOn(checkoutApi, 'submitPaymentApi')
        .mockResolvedValueOnce({
          paymentId: 'pay_fail_01',
          orderId: 'ord_retry_01',
          status: 'FAILED',
          orderStatus: 'PAYMENT_FAILED',
          amount: '100000',
          method: 'E_WALLET',
          message: 'Tài khoản không đủ số dư.',
        });

      renderCheckout({ authenticated: true, withCart: true });

      const submitBtn = await screen.findByTestId('checkout-submit-btn');
      fireEvent.click(submitBtn);

      // Verify error banner is shown
      expect(await screen.findByTestId('checkout-error')).toHaveTextContent(
        'Tài khoản không đủ số dư',
      );

      // Cart is KEPT! Items are still visible
      expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByText(/Cà phê Sữa Đá/i)).toBeInTheDocument();

      // Submit button text changes to retry
      expect(screen.getByTestId('checkout-submit-btn')).toHaveTextContent('Thử lại thanh toán');

      // 2nd attempt: Retry with domestic ATM payment
      mockSubmitPayment.mockResolvedValueOnce({
        paymentId: 'pay_success_02',
        orderId: 'ord_retry_01',
        status: 'SUCCESS',
        orderStatus: 'PAID',
        amount: '100000',
        method: 'DOMESTIC_ATM',
        transactionRef: 'TX_RETRY_PASS',
      });

      // Switch to domestic ATM
      fireEvent.click(screen.getByTestId('payment-option-DOMESTIC_ATM'));

      // Click Retry
      fireEvent.click(screen.getByTestId('checkout-submit-btn'));

      await waitFor(() => {
        expect(mockSubmitPayment).toHaveBeenCalledTimes(2);
      });

      // CRITICAL VERIFICATION: createOrderApi must NOT be called again on retry!
      expect(mockCreateOrder).toHaveBeenCalledTimes(1);

      // A confirmed decline gets a new payment attempt key on the SAME order
      const firstKey = mockSubmitPayment.mock.calls[0][1];
      const secondKey = mockSubmitPayment.mock.calls[1][1];
      expect(secondKey).not.toBe(firstKey);
      expect(mockSubmitPayment.mock.calls[1][0].orderId).toBe('ord_retry_01');

      // Success view appears after successful retry
      expect(await screen.findByTestId('checkout-success-view')).toBeInTheDocument();
      expect(screen.getByTestId('order-code')).toHaveTextContent('#BL-RETRY');
    });

    it('handles out of stock (400) without clearing the cart', async () => {
      vi.spyOn(checkoutApi, 'createOrderApi').mockRejectedValueOnce(
        new ApiError(400, 'Một số món trong giỏ hàng hiện đã hết. Vui lòng cập nhật lại giỏ hàng.'),
      );

      renderCheckout({ authenticated: true, withCart: true });

      const submitBtn = await screen.findByTestId('checkout-submit-btn');
      fireEvent.click(submitBtn);

      expect(await screen.findByTestId('checkout-error')).toHaveTextContent(
        'Một số món trong giỏ hàng hiện đã hết',
      );

      // Cart must be preserved so user can edit items
      expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
      expect(screen.getByText(/Cà phê Sữa Đá/i)).toBeInTheDocument();
    });

    it('handles 401 Unauthorized during checkout by redirecting to login', async () => {
      vi.spyOn(checkoutApi, 'createOrderApi').mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized'),
      );

      renderCheckout({ authenticated: true, withCart: true });

      const submitBtn = await screen.findByTestId('checkout-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?redirect=/checkout');
      });
    });
  });
});
