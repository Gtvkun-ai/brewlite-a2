'use client';

import Link from 'next/link';
import React from 'react';
import {
  ShoppingBag,
  X,
  Coffee,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  SIZE_OPTIONS,
  TOPPING_OPTIONS,
  useCart,
  formatPreparation,
} from '../context/CartContext';
import { formatVnd } from '../lib/format';
import type { ItemSize, ToppingCode } from '../lib/types';
import { useDialog } from './useDialog';

const TOPPING_LABELS: Record<ToppingCode, string> = TOPPING_OPTIONS.reduce(
  (acc, item) => {
    acc[item.code] = item.label;
    return acc;
  },
  {} as Record<ToppingCode, string>,
);

export interface CartDrawerProps {
  /** Nếu truyền isOpen, ưu tiên prop này hơn state trong CartContext */
  isOpen?: boolean;
  onClose?: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
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
    isDrawerOpen,
    closeDrawer,
  } = useCart();

  const open = isOpen !== undefined ? isOpen : isDrawerOpen;
  const handleClose = onClose ?? closeDrawer;
  const dialogRef = useDialog(open, handleClose);

  if (!open) return null;

  return (
    <div
      className="cart-drawer-backdrop"
      data-testid="cart-drawer-backdrop"
      onClick={handleClose}
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="cart-drawer"
        data-testid="cart-drawer"
        aria-label="Giỏ hàng"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cart-drawer__header">
          <div>
            <h2 className="cart-drawer__title">
              <ShoppingBag size={20} className="inline mr-2 text-amber-600" />
              <span>Giỏ hàng ({totalCount})</span>
            </h2>
            <p className="cart-drawer__subtitle">
              Kiểm tra cấu hình món trước khi đặt hàng
            </p>
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={handleClose}
            data-testid="cart-drawer-close"
            aria-label="Đóng giỏ hàng"
          >
            <X size={18} />
          </button>
        </header>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="state" data-testid="cart-drawer-empty">
              <div className="state__icon">
                <Coffee size={40} className="text-amber-500" />
              </div>
              <h3 className="state__title">Giỏ hàng đang trống</h3>
              <p className="page__subtitle">
                Bạn chưa chọn món nào. Hãy chọn đồ uống yêu thích từ thực đơn nhé!
              </p>
              <div className="btn-group mt-2">
                <Link
                  href="/"
                  className="btn btn--primary"
                  onClick={handleClose}
                >
                  Khám phá Menu
                </Link>
                {process.env.NEXT_PUBLIC_USE_FIXTURES === 'true' && <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={loadFixtureCart}
                  data-testid="drawer-load-fixture-btn"
                >
                  <Sparkles size={14} className="inline mr-1 text-amber-600" />
                  <span>Nạp giỏ hàng mẫu</span>
                </button>}
              </div>
            </div>
          ) : (
            <>
              <ul className="cart-list" data-testid="cart-drawer-list">
                {items.map((item, idx) => (
                  <li
                    key={`${item.productId}-${item.size}-${item.toppings.join('_')}-${idx}`}
                    className="cart-line"
                    data-testid="cart-drawer-item"
                  >
                    <div className="cart-line__main">
                      <div className="cart-line__info">
                        <strong className="cart-line__name">{item.name}</strong>
                        <div className="cart-line__meta">
                          <span className="badge badge--neutral">
                            Size: {item.size}
                          </span>
                          {item.toppings.length > 0 ? (
                            <span className="badge badge--accent">
                              Topping:{' '}
                              {item.toppings
                                .map((t) => TOPPING_LABELS[t] || t)
                                .join(', ')}
                            </span>
                          ) : (
                            <span className="badge badge--neutral">
                              Không topping
                            </span>
                          )}
                        </div>
                        {item.category !== 'Pastry' && (
                          <p className="cart-line__unit-price" data-testid={`drawer-preparation-${idx}`}>
                            {formatPreparation(item.sugar, item.ice)}
                          </p>
                        )}
                        <div className="cart-line__unit-price">
                          Đơn giá: {formatVnd(item.unitPrice)}
                        </div>
                      </div>

                      <div className="cart-line__right">
                        <strong
                          className="cart-line__total"
                          data-testid={`drawer-item-total-${idx}`}
                        >
                          {formatVnd(item.itemTotal)}
                        </strong>
                        <button
                          type="button"
                          className="cart-line__remove"
                          onClick={() => removeItem(idx)}
                          data-testid={`drawer-remove-${idx}`}
                          aria-label={`Xóa ${item.name}`}
                        >
                          <Trash2 size={13} className="inline mr-1" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    <div className="cart-line__controls">
                      <select
                        aria-label={`Đổi size cho ${item.name}`}
                        className="cart-line__size-select"
                        value={item.size}
                        onChange={(e) =>
                          updateItemOptions(
                            idx,
                            e.target.value as ItemSize,
                            item.toppings,
                          )
                        }
                        data-testid={`drawer-size-select-${idx}`}
                      >
                        {SIZE_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.shortLabel}
                          </option>
                        ))}
                      </select>

                      <div className="qty-control qty-control--sm">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          data-testid={`drawer-qty-decrease-${idx}`}
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={13} />
                        </button>
                        <span
                          className="qty-value"
                          data-testid={`drawer-qty-value-${idx}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          data-testid={`drawer-qty-increase-${idx}`}
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="form-group mt-2">
                <label className="form-label" htmlFor="drawer-delivery-note">
                  Ghi chú đơn hàng
                </label>
                <input
                  id="drawer-delivery-note"
                  type="text"
                  className="form-input"
                  placeholder="VD: Giao tại bàn số 5, ít đá..."
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  data-testid="drawer-delivery-note"
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer__footer">
            <div className="cart-summary-row">
              <span>Tổng số lượng:</span>
              <strong data-testid="drawer-total-count">{totalCount} món</strong>
            </div>
            <div className="cart-summary-row cart-summary-row--total">
              <span>Tạm tính (xem trước):</span>
              <strong
                className="text-accent"
                data-testid="drawer-subtotal-preview"
              >
                {formatVnd(subTotal)}
              </strong>
            </div>
            <p className="form-hint">
              Tổng tiền sẽ được kiểm tra lại khi đặt hàng.
            </p>
            <div className="cart-drawer__actions mt-2">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={clearCart}
                data-testid="drawer-clear-btn"
              >
                <Trash2 size={14} className="inline mr-1" />
                <span>Xóa tất cả</span>
              </button>
              <Link
                href="/cart"
                className="btn btn--secondary"
                onClick={handleClose}
                data-testid="drawer-view-cart-link"
              >
                Trang giỏ hàng
              </Link>
              <Link
                href="/checkout"
                className="btn btn--primary"
                onClick={handleClose}
                data-testid="drawer-checkout-link"
              >
                <span>Tiến hành đặt hàng</span>
                <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
