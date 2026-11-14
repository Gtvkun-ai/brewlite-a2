'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useRef, useState } from 'react';
import { genQRText } from 'vietqr';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ApiError } from '../../lib/api';
import {
  createOrderApi,
  generateIdempotencyKey,
  submitPaymentApi,
} from '../../lib/checkout-api';
import { formatVnd } from '../../lib/format';
import { VIETQR_RECIPIENT } from '../../lib/vietqr-account';
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
    id: 'VIETQR_MOMO',
    label: 'Ví điện tử / Chuyển khoản',
    icon: '🔳',
    desc: 'Quét bằng ứng dụng ngân hàng hỗ trợ VietQR',
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
  const {
    items,
    totalCount,
    subTotal,
    clearCart,
    loadFixtureCart,
    deliveryNote: initialDeliveryNote,
    setDeliveryNote: setCartDeliveryNote,
  } = useCart();

  // Checkout transaction state - prefill with note from cart if available (E-20 integration)
  const [deliveryNote, setDeliveryNote] = useState(initialDeliveryNote || '');

  // Sync deliveryNote from CartContext when note is added/updated in Cart or Product page
  useEffect(() => {
    if (initialDeliveryNote && initialDeliveryNote !== deliveryNote) {
      setDeliveryNote(initialDeliveryNote);
    }
  }, [initialDeliveryNote, deliveryNote]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('E_WALLET');
  const [accountRef, setAccountRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Idempotency & Order persistence across retries
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [serverTotalAmount, setServerTotalAmount] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const idempotencyKeyRef = useRef<string>('');
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

  // Initialize a stable Idempotency-Key on first load or after a completed order
  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      const key = generateIdempotencyKey();
      idempotencyKeyRef.current = key;
      setPaymentReference(`BL-${key.replace(/-/g, '').slice(0, 8).toUpperCase()}`);
    }
  }, []);

  const qrAmount = serverTotalAmount ?? subTotal;
  const qrTransferContent = paymentReference ? `BREWLITE ${paymentReference}` : '';

  useEffect(() => {
    if (!paymentReference || !Number.isSafeInteger(qrAmount) || qrAmount <= 0) {
      setQrPayload('');
      return;
    }

    setQrPayload(genQRText({
      acqId: VIETQR_RECIPIENT.bankBin,
      accountNo: VIETQR_RECIPIENT.accountNumber,
      amount: String(qrAmount),
      addInfo: qrTransferContent,
    }));
  }, [paymentReference, qrAmount, qrTransferContent]);

  // Trigger celebration confetti on confirmed payment in browser only
  useEffect(() => {
    if (paymentResult && paymentResult.status === 'SUCCESS') {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        const canvas = document.createElement('canvas');
        if (typeof canvas.getContext === 'function' && canvas.getContext('2d')) {
          void import('canvas-confetti')
            .then((module) => {
              const confetti = module.default;
              confetti({
                particleCount: 110,
                spread: 75,
                origin: { y: 0.6 },
                colors: ['#c67c4e', '#2b1d15', '#f7d9b8', '#2e7d32', '#d4a373'],
              });
            })
            .catch(() => {});
        }
      }
    }
  }, [paymentResult]);

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
              <span className="summary-value">
                {selectedMethod === 'VIETQR_MOMO' ? 'Ví điện tử / Chuyển khoản' : selectedMethod}
              </span>
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
        setServerTotalAmount(Number(newOrder.totalAmount));
        setPaymentReference(newOrder.code);
      }

      // STEP 2: Process Payment (POST /payments) with stable Idempotency-Key
      // Server-authoritative: client does NOT send amount
      const paymentRes = await submitPaymentApi(
        {
          orderId: currentOrderId,
          method: selectedMethod,
          accountRef:
            selectedMethod === 'VIETQR_MOMO'
              ? undefined
              : accountRef.trim() || undefined,
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
              onChange={(e) => {
                setDeliveryNote(e.target.value);
                setCartDeliveryNote(e.target.value);
              }}
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

          {selectedMethod === 'VIETQR_MOMO' ? (
            <div className="checkout-qr" data-testid="payment-qr-panel">
              <div className="checkout-qr__header">
                <div className="checkout-qr__brand">
                  <Image src="/icons/icon-192x192.png" alt="" width={42} height={42} />
                  <div>
                    <strong>BrewLite</strong>
                    <span>Thanh toán đơn hàng</span>
                  </div>
                </div>
                <span className="checkout-qr__rail">VIETQR · NAPAS 247</span>
              </div>

              <div className="checkout-qr__content">
                <div className="checkout-qr__code" data-testid="payment-qr">
                  {qrPayload ? (
                    <QRCodeSVG
                      value={qrPayload}
                      title="VietQR đã điền sẵn số tiền và nội dung"
                      size={300}
                      level="H"
                      includeMargin
                      fgColor="#a94b1d"
                      imageSettings={{
                        src: '/icons/icon-192x192.png',
                        width: 54,
                        height: 54,
                        excavate: true,
                      }}
                    />
                  ) : (
                    <span className="checkout-qr__dynamic-loading">Đang tạo mã QR…</span>
                  )}
                </div>

                <div className="checkout-qr__details">
                  <p className="checkout-qr__instruction">
                    Quét mã bằng ứng dụng ngân hàng hỗ trợ VietQR. Thông tin người nhận và nội dung có sẵn trong mã.
                  </p>
                  <div className="checkout-qr__amount">
                    <span>Số tiền đơn hàng</span>
                    <strong data-testid="qr-amount">{formatVnd(qrAmount)}</strong>
                  </div>
                  <dl className="checkout-qr__transfer">
                    <div>
                      <dt>Người nhận</dt>
                      <dd>{VIETQR_RECIPIENT.accountName}</dd>
                    </div>
                    <div>
                      <dt>Số tài khoản</dt>
                      <dd>0794447631</dd>
                    </div>
                    <div>
                      <dt>Nội dung chuyển khoản</dt>
                      <dd className="checkout-qr__reference" data-testid="qr-reference">
                        {qrTransferContent}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <p className="checkout-qr__notice">
                QR động điền sẵn số tiền và nội dung trong ứng dụng ngân hàng. Chuyển khoản là giao dịch thật; BrewLite hiện chưa tự đối soát giao dịch ngân hàng.
              </p>
            </div>
          ) : (
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
          )}

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
                : selectedMethod === 'VIETQR_MOMO'
                  ? 'Xác nhận thanh toán mô phỏng'
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
