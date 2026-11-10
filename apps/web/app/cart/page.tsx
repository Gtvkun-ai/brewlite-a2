'use client';

import Link from 'next/link';
import React from 'react';
import {
  sanitizeToppings,
  SIZE_OPTIONS,
  TOPPING_OPTIONS,
  useCart,
} from '../../context/CartContext';
import { formatVnd } from '../../lib/format';
import type { ItemSize, ToppingCode } from '../../lib/types';

const TOPPING_LABELS: Record<ToppingCode, string> = TOPPING_OPTIONS.reduce(
  (acc, item) => {
    acc[item.code] = item.label;
    return acc;
  },
  {} as Record<ToppingCode, string>,
);

export default function CartPage() {
  const {
    items,
    totalCount,
    subTotal,
    updateQuantity,
    updateItemOptions,
    removeItem,
    clearCart,
    loadFixtureCart,
    deliveryNote,
    setDeliveryNote,
  } = useCart();

  const handleToggleItemTopping = (
    idx: number,
    currentSize: ItemSize,
    currentToppings: ToppingCode[],
    code: ToppingCode,
  ) => {
    const nextToppings = currentToppings.includes(code)
      ? currentToppings.filter((t) => t !== code)
      : sanitizeToppings([...currentToppings, code]);
    updateItemOptions(idx, currentSize, nextToppings);
  };

  if (items.length === 0) {
    return (
      <main className="page" data-testid="cart-page">
        <header className="page__header">
          <h1 className="page__title">Giỏ hàng của bạn</h1>
          <p className="page__subtitle">
            Tùy chỉnh đồ uống và kiểm tra tạm tính trước khi thanh toán.
          </p>
        </header>

        <div className="state checkout-card" data-testid="cart-empty-state">
          <div className="state__icon">🛒</div>
          <h2 className="state__title">Giỏ hàng của bạn đang trống</h2>
          <p className="page__subtitle">
            Hãy quay lại thực đơn để chọn món cà phê, trà hoặc bánh ngọt yêu thích nhé!
          </p>
          <div className="btn-group mt-3">
            <Link
              href="/"
              className="btn btn--primary"
              data-testid="cart-back-to-menu"
            >
              Xem thực đơn
            </Link>
            <button
              type="button"
              onClick={loadFixtureCart}
              className="btn btn--secondary"
              data-testid="cart-load-fixture-btn"
            >
              Nạp giỏ hàng mẫu để kiểm thử
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page" data-testid="cart-page">
      <header className="page__header">
        <Link href="/" className="back-link">
          ← Tiếp tục chọn món
        </Link>
        <h1 className="page__title">Giỏ hàng ({totalCount} món)</h1>
        <p className="page__subtitle">
          Cùng cấu hình tự động gộp dòng • Khác size/topping tự động tách dòng.
        </p>
      </header>

      <div className="checkout-layout">
        {/* Cột trái: Danh sách món trong giỏ */}
        <section className="checkout-card" data-testid="cart-items-section">
          <div className="cart-section-header">
            <h2 className="section-title">Danh sách món đã chọn</h2>
            <button
              type="button"
              onClick={clearCart}
              className="cart-clear-link"
              data-testid="cart-clear-btn"
            >
              Xóa toàn bộ giỏ
            </button>
          </div>

          <ul className="cart-list" data-testid="cart-list">
            {items.map((item, idx) => (
              <li
                key={`${item.productId}-${item.size}-${item.toppings.join('_')}-${idx}`}
                className="cart-line"
                data-testid="cart-item"
              >
                <div className="cart-line__main">
                  <div className="cart-line__info">
                    <Link
                      href={`/products/${item.productId}`}
                      className="cart-line__name-link"
                    >
                      <strong className="cart-line__name">{item.name}</strong>
                    </Link>
                    <div className="cart-line__meta">
                      <span
                        className="badge badge--neutral"
                        data-testid={`cart-item-size-${idx}`}
                      >
                        Size: {item.size}
                      </span>
                      {item.toppings.length > 0 ? (
                        <span
                          className="badge badge--accent"
                          data-testid={`cart-item-toppings-${idx}`}
                        >
                          Topping:{' '}
                          {item.toppings
                            .map((t) => TOPPING_LABELS[t] || t)
                            .join(', ')}
                        </span>
                      ) : (
                        <span
                          className="badge badge--neutral"
                          data-testid={`cart-item-toppings-${idx}`}
                        >
                          Không topping
                        </span>
                      )}
                    </div>
                    <div
                      className="cart-line__unit-price"
                      data-testid={`cart-item-unit-${idx}`}
                    >
                      Đơn giá: {formatVnd(item.unitPrice)} (Gốc:{' '}
                      {formatVnd(item.basePrice)})
                    </div>
                  </div>

                  <div className="cart-line__right">
                    <strong
                      className="cart-line__total"
                      data-testid={`cart-item-total-${idx}`}
                    >
                      {formatVnd(item.itemTotal)}
                    </strong>
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => removeItem(idx)}
                      data-testid={`cart-remove-${idx}`}
                    >
                      Xóa món
                    </button>
                  </div>
                </div>

                {/* Chỉnh sửa nhanh Size, Topping và Số lượng ngay trong giỏ */}
                <div className="cart-line__options">
                  <div className="cart-line__size-group">
                    <label
                      htmlFor={`cart-size-${idx}`}
                      className="cart-line__option-label"
                    >
                      Đổi size:
                    </label>
                    <select
                      id={`cart-size-${idx}`}
                      className="cart-line__size-select"
                      value={item.size}
                      onChange={(e) =>
                        updateItemOptions(
                          idx,
                          e.target.value as ItemSize,
                          item.toppings,
                        )
                      }
                      data-testid={`cart-size-select-${idx}`}
                    >
                      {SIZE_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cart-line__topping-pills">
                    {TOPPING_OPTIONS.map((top) => {
                      const active = item.toppings.includes(top.code);
                      return (
                        <button
                          key={top.code}
                          type="button"
                          className={`topping-pill ${active ? 'topping-pill--active' : ''}`}
                          onClick={() =>
                            handleToggleItemTopping(
                              idx,
                              item.size,
                              item.toppings,
                              top.code,
                            )
                          }
                          data-testid={`cart-topping-${idx}-${top.code}`}
                        >
                          {active ? '✓ ' : '+ '}
                          {top.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="cart-line__controls">
                  <span className="cart-line__option-label">Số lượng:</span>
                  <div className="qty-control qty-control--sm">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      data-testid={`cart-qty-decrease-${idx}`}
                      aria-label={`Giảm số lượng ${item.name}`}
                    >
                      −
                    </button>
                    <span
                      className="qty-value"
                      data-testid={`cart-qty-value-${idx}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      data-testid={`cart-qty-increase-${idx}`}
                      aria-label={`Tăng số lượng ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Cột phải: Ghi chú & Tóm tắt tạm tính */}
        <section className="checkout-card" data-testid="cart-summary-card">
          <h2 className="section-title">Tóm tắt giỏ hàng</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="cart-delivery-note">
              Ghi chú cho Barista / Giao hàng (tùy chọn)
            </label>
            <textarea
              id="cart-delivery-note"
              rows={2}
              className="form-input form-textarea"
              placeholder="VD: Giao tại bàn số 4, ít đá..."
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              data-testid="cart-delivery-note"
            />
          </div>

          <div className="order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Số dòng cấu hình:</span>
              <span className="summary-value" data-testid="cart-line-count">
                {items.length} dòng
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tổng số lượng cốc:</span>
              <strong className="summary-value" data-testid="cart-total-count">
                {totalCount}
              </strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tạm tính (xem trước):</span>
              <strong
                className="summary-value text-accent"
                data-testid="cart-subtotal-preview"
              >
                {formatVnd(subTotal)}
              </strong>
            </div>
          </div>

          <p className="form-hint">
            ℹ️ Giá hiển thị ở client chỉ dùng để xem trước. Khi đặt hàng, hệ thống chỉ gửi{' '}
            <code>productId / selectedSize / selectedToppings / quantity</code> và tính giá chính thức tại server.
          </p>

          <Link
            href="/checkout"
            className="btn btn--block btn--primary btn--lg mt-3"
            data-testid="cart-checkout-btn"
          >
            Tiến hành đặt hàng & Thanh toán →
          </Link>
        </section>
      </div>
    </main>
  );
}

