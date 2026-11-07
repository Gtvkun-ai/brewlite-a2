'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ApiError } from '../../lib/api';
import {
  createOrderApi,
  generateIdempotencyKey,
  submitPaymentApi,
} from '../../lib/checkout-api';
import { formatVnd } from '../../lib/format';
import type {
  CreateOrderItemDto,
  PaymentMethod,
  PaymentResponse,
} from '../../lib/types';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
  {
    id: 'E_WALLET',
    label: 'Ví điện tử BrewPay',
    icon: '📱',
    desc: 'Thanh toán tức thì qua ví điện tử BrewLite',
  },
  {
    id: 'CREDIT_CARD',
    label: 'Thẻ Quốc tế (Visa / Master)',
    icon: '💳',
    desc: 'Hỗ trợ thẻ tín dụng và ghi nợ quốc tế',
  },
  {
    id: 'DOMESTIC_ATM',
    label: 'Thẻ ATM Nội địa (Napas)',
    icon: '🏦',
    desc: 'Thanh toán qua cổng Napas 40+ ngân hàng',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, totalCount, subTotal, clearCart, loadFixtureCart } = useCart();

  // Checkout transaction state
  const [deliveryNote, setDeliveryNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('E_WALLET');
  const [accountRef, setAccountRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Idempotency & Order persistence across retries
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>('');
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

  // Initialize a stable Idempotency-Key on first load or after a completed order
  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
  }, []);

  // 1. Unauthenticated Guard
  if (!authLoading && !isAuthenticated) {
    return (
      <main className="page">
        <div className="auth-card" data-testid="checkout-unauth-warning">
          <h1 className="auth-card__title">Yêu cầu đăng nhập</h1>
          <p className="auth-card__subtitle">
            Bạn cần đăng nhập tài khoản BrewLite để tiếp tục đặt hàng và thanh toán.
          </p>
          <div className="alert alert--info">
            ℹ️ Giỏ hàng của bạn ({totalCount} món) đã được lưu và sẽ tiếp tục sau khi đăng nhập.
          </div>
          <div className="btn-group">
            <Link
              href="/login?redirect=/checkout"
              className="btn btn--block btn--primary"
              data-testid="checkout-login-btn"
            >
              Đăng nhập ngay
            </Link>
            <Link
              href="/register?redirect=/checkout"
              className="btn btn--block btn--secondary"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. Order Success View (After confirmed PAID)
  if (paymentResult && paymentResult.status === 'SUCCESS') {
    return (
      <main className="page">
        <div className="auth-card text-center" data-testid="checkout-success-view">
          <div className="success-icon">🎉</div>
          <h1 className="auth-card__title text-success">Đặt hàng thành công!</h1>
          <p className="auth-card__subtitle">
            Cảm ơn bạn đã đặt món tại BrewLite. Barista đang chuẩn bị đồ uống cho bạn.
          </p>

          <div className="order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Mã đơn hàng:</span>
              <strong className="summary-value text-accent" data-testid="order-code">
                #{orderCode || paymentResult.orderId}
              </strong>
            </div>
            {paymentResult.transactionRef && (
              <div className="summary-row">
                <span className="summary-label">Mã giao dịch:</span>
                <span className="summary-value" data-testid="transaction-ref">
                  {paymentResult.transactionRef}
                </span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">Trạng thái:</span>
              <span className="badge badge--success">Đã thanh toán (PAID)</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Phương thức:</span>
              <span className="summary-value">{selectedMethod}</span>
            </div>
          </div>

          <div className="btn-group">
            <Link
              href={`/orders/${encodeURIComponent(orderCode || paymentResult.orderId)}`}
              className="btn btn--block btn--primary"
              data-testid="view-order-btn"
            >
              Xem chi tiết đơn hàng
            </Link>
            <Link
              href="/orders"
              className="btn btn--block btn--secondary"
              data-testid="view-history-btn"
            >
              Lịch sử đơn hàng
            </Link>
            <Link href="/" className="link mt-2">
              ← Tiếp tục đặt thêm món
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Empty Cart Guard
  if (items.length === 0) {
    return (
      <main className="page">
        <div className="state" data-testid="checkout-empty-state">
          <div className="state__icon">🛒</div>
          <h2 className="state__title">Giỏ hàng của bạn đang trống</h2>
          <p className="page__subtitle">
            Hãy khám phá thực đơn cà phê và trà tươi ngon của BrewLite để chọn món bạn thích nhé!
          </p>
          <div className="btn-group mt-3">
            <Link href="/" className="btn btn--primary">
              Xem thực đơn
            </Link>
            <button
              type="button"
              onClick={loadFixtureCart}
              className="btn btn--secondary"
              data-testid="load-fixture-btn"
            >
              Nạp giỏ hàng mẫu để kiểm thử
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 4. Main Checkout Flow
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit
    setErrorMessage(null);

    const authToken = token || '';
    if (!authToken) {
      setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      router.push('/login?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);

    try {
      let currentOrderId = orderId;
      let currentOrderCode = orderCode;

      // STEP 1: Create Order if not yet created (POST /orders)
      // Keeps orderId stable across retries without re-creating a duplicate order
      if (!currentOrderId) {
        const orderItemsDto: CreateOrderItemDto[] = items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          selectedSize: it.size,
          selectedToppings: it.toppings,
        }));

        const newOrder = await createOrderApi(
          {
            deliveryNote: deliveryNote.trim() || undefined,
            items: orderItemsDto,
          },
          authToken,
        );

        currentOrderId = newOrder.id;
        currentOrderCode = newOrder.code;
        setOrderId(newOrder.id);
        setOrderCode(newOrder.code);
      }

      // STEP 2: Process Payment (POST /payments) with stable Idempotency-Key
      // Server-authoritative: client does NOT send amount
      const paymentRes = await submitPaymentApi(
        {
          orderId: currentOrderId,
          method: selectedMethod,
          accountRef: accountRef.trim() || undefined,
        },
        idempotencyKeyRef.current,
        authToken,
      );

      if (paymentRes.status === 'SUCCESS') {
        // Clear cart ONLY after confirmed PAID
        clearCart();
        setPaymentResult(paymentRes);
      } else {
        // Payment failed: keep cart, keep orderId and idempotencyKey for retry
        setErrorMessage(
          paymentRes.message ||
            'Thanh toán bị từ chối. Vui lòng kiểm tra lại số dư hoặc chọn phương thức khác.',
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('Phiên đăng nhập hết hạn (401). Vui lòng đăng nhập lại.');
          router.push('/login?redirect=/checkout');
          return;
        }
        setErrorMessage(err.message || 'Xử lý đơn hàng thất bại.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Lỗi mạng hoặc hệ thống không thể phản hồi. Vui lòng bấm Thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <header className="page__header">
        <Link href="/" className="back-link">
          ← Quay lại thực đơn
        </Link>
        <h1 className="page__title">Xác nhận & Thanh toán</h1>
        <p className="page__subtitle">Kiểm tra giỏ hàng và chọn phương thức thanh toán</p>
      </header>

      {errorMessage && (
        <div className="alert alert--error" data-testid="checkout-error">
          ⚠️ {errorMessage}
          {orderId && (
            <p className="mt-1 small">
              Đơn hàng #{orderCode || orderId} đã được lưu tạm. Bạn có thể bấm nút &quot;Thử lại thanh toán&quot;
              mà không sợ tạo đơn mới hoặc trừ trùng tiền.
            </p>
          )}
        </div>
      )}

      <div className="checkout-layout">
        {/* Left Column: Order items */}
        <section className="checkout-card" data-testid="cart-summary">
          <h2 className="section-title">1. Tóm tắt món ({totalCount})</h2>
          <div className="checkout-items">
            {items.map((it, idx) => (
              <div key={`${it.productId}-${idx}`} className="checkout-item" data-testid="checkout-item">
                <div className="checkout-item__info">
                  <div className="checkout-item__name">
                    <strong>{it.name}</strong> x {it.quantity}
                  </div>
                  <div className="checkout-item__meta">
                    <span className="badge badge--neutral">Size: {it.size}</span>
                    {it.toppings.length > 0 && (
                      <span className="badge badge--accent">
                        Topping: {it.toppings.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="checkout-item__price" data-testid="item-price">
                  {formatVnd(it.itemTotal)}
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-subtotal">
            <span>Tạm tính (chờ server xác nhận):</span>
            <strong className="text-accent" data-testid="cart-subtotal">
              {formatVnd(subTotal)}
            </strong>
          </div>

          <div className="form-group mt-3">
            <label className="form-label" htmlFor="deliveryNote">
              Ghi chú cho Barista (tùy chọn)
            </label>
            <textarea
              id="deliveryNote"
              rows={2}
              className="form-input form-textarea"
              placeholder="VD: Ít đá, nhiều sữa, giao lúc 10h..."
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              disabled={isSubmitting}
              data-testid="delivery-note"
            />
          </div>
        </section>

        {/* Right Column: Payment options & Submit */}
        <section className="checkout-card">
          <h2 className="section-title">2. Phương thức thanh toán</h2>
          <div className="payment-methods">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`payment-option ${selectedMethod === method.id ? 'payment-option--active' : ''}`}
                data-testid={`payment-option-${method.id}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={() => setSelectedMethod(method.id)}
                  disabled={isSubmitting}
                  className="payment-option__radio"
                />
                <span className="payment-option__icon">{method.icon}</span>
                <div className="payment-option__content">
                  <div className="payment-option__title">{method.label}</div>
                  <div className="payment-option__desc">{method.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="form-group mt-3">
            <label className="form-label" htmlFor="accountRef">
              Thông tin tài khoản / Số thẻ mô phỏng
            </label>
            <input
              id="accountRef"
              type="text"
              className="form-input"
              placeholder="VD: 0901234567 hoặc 9704-xxxx-xxxx"
              value={accountRef}
              onChange={(e) => setAccountRef(e.target.value)}
              disabled={isSubmitting}
              data-testid="account-ref"
            />
            <p className="form-hint">
              Hệ thống sử dụng cổng thanh toán mô phỏng an toàn với cơ chế Idempotency.
            </p>
          </div>

          <div className="customer-info-box mt-3">
            <span>Khách hàng: </span>
            <strong>{user?.fullName || user?.email}</strong>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="btn btn--block btn--primary mt-3 btn--lg"
            data-testid="checkout-submit-btn"
          >
            {isSubmitting
              ? 'Đang xử lý đơn hàng…'
              : orderId
                ? 'Thử lại thanh toán'
                : 'Xác nhận đặt hàng & Thanh toán'}
          </button>

          <p className="secure-badge mt-2">
            🔒 Bảo mật theo chuẩn Idempotency v4 & JWT Authentication
          </p>
        </section>
      </div>
    </main>
  );
}
