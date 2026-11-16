'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import {
  calculateItemTotal,
  calculateUnitPrice,
  sanitizeToppings,
  SUGAR_OPTIONS,
  ICE_OPTIONS,
  SIZE_OPTIONS,
  TOPPING_OPTIONS,
  useCart,
} from '../context/CartContext';
import { formatVnd } from '../lib/format';
import type { CartItem, IceLevel, ItemSize, Product, SugarLevel, ToppingCode } from '../lib/types';

export interface ProductOptionSelectorProps {
  product: Product;
  onAdded?: (item: CartItem) => void;
}

export function ProductOptionSelector({
  product,
  onAdded,
}: ProductOptionSelectorProps) {
  const { addItem, deliveryNote, setDeliveryNote, openDrawer } = useCart();

  const [selectedSize, setSelectedSize] = useState<ItemSize>('REGULAR');
  const [selectedToppings, setSelectedToppings] = useState<ToppingCode[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [noteInput, setNoteInput] = useState<string>(deliveryNote || '');
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  // Thức uống: Tùy biến đá và đường (Theo công thức chuẩn)
  const isBeverage = product.category !== 'Pastry';
  const [selectedSugar, setSelectedSugar] = useState<SugarLevel>(100);
  const [selectedIce, setSelectedIce] = useState<IceLevel>('NORMAL');

  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0;
  const maxStock = product.stockQuantity > 0 ? product.stockQuantity : 99;

  const unitPrice = calculateUnitPrice(
    product.basePrice,
    selectedSize,
    selectedToppings,
  );
  const itemTotal = calculateItemTotal(unitPrice, quantity);

  const handleToggleTopping = (code: ToppingCode) => {
    setAddedSuccess(false);
    setSelectedToppings((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : sanitizeToppings([...prev, code]),
    );
  };

  const handleSizeChange = (size: ItemSize) => {
    setAddedSuccess(false);
    setSelectedSize(size);
  };

  const handleDecreaseQty = () => {
    setAddedSuccess(false);
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQty = () => {
    setAddedSuccess(false);
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const handleAddToCart = () => {
    if (isOutOfStock || quantity <= 0) return;

    const cleanToppings = sanitizeToppings(selectedToppings);
    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      basePrice: String(product.basePrice),
      size: selectedSize,
      toppings: cleanToppings,
      sugar: isBeverage ? selectedSugar : 100,
      ice: isBeverage ? selectedIce : 'NORMAL',
      quantity,
      unitPrice: String(unitPrice),
      itemTotal: String(itemTotal),
      imageUrl: product.imageUrl,
      category: product.category,
    };

    addItem(cartItem);

    setDeliveryNote(noteInput.trim());

    setAddedSuccess(true);
    onAdded?.(cartItem);
  };

  return (
    <section className="product-options" data-testid="product-option-selector">
      {/* 1. Size Selector */}
      <div className="option-group">
        <div className="option-group__header">
          <h2 className="option-group__title">Chọn kích cỡ (Size)</h2>
          <span className="badge badge--accent">Bắt buộc</span>
        </div>
        <div className="option-grid">
          {SIZE_OPTIONS.map((opt) => {
            const isActive = selectedSize === opt.code;
            return (
              <label
                key={opt.code}
                className={`option-card ${isActive ? 'option-card--active' : ''}`}
                data-testid={`size-${opt.code}`}
              >
                <input
                  type="radio"
                  name="product-size"
                  value={opt.code}
                  checked={isActive}
                  onChange={() => handleSizeChange(opt.code)}
                  disabled={isOutOfStock}
                  className="option-card__input"
                />
                <span className="option-card__label">{opt.label}</span>
                <span className="option-card__price">
                  {opt.surcharge > 0 ? `+${formatVnd(opt.surcharge)}` : '+0 ₫'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Topping Selector */}
      <div className="option-group">
        <div className="option-group__header">
          <h2 className="option-group__title">Thêm Topping</h2>
          <span className="badge badge--neutral">Tùy chọn</span>
        </div>
        <div className="option-list">
          {TOPPING_OPTIONS.map((top) => {
            const isChecked = selectedToppings.includes(top.code);
            return (
              <label
                key={top.code}
                className={`option-card ${isChecked ? 'option-card--active' : ''}`}
                data-testid={`topping-${top.code}`}
              >
                <input
                  type="checkbox"
                  name={`topping-${top.code}`}
                  value={top.code}
                  checked={isChecked}
                  onChange={() => handleToggleTopping(top.code)}
                  disabled={isOutOfStock}
                  className="option-card__input"
                />
                <span className="option-card__label">{top.label}</span>
                <span className="option-card__price">
                  +{formatVnd(top.surcharge)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Tùy chọn Độ ngọt (Đường) & Mức đá (Theo công thức chuẩn) */}
      {isBeverage && (
        <div className="customization-section" data-testid="customization-sugar-ice">
          <div className="customization-section__header">
            <span className="customization-section__title">Tùy biến pha chế</span>
            {selectedSugar === 100 && selectedIce === 'NORMAL' ? (
              <span className="badge badge--accent">Theo công thức chuẩn</span>
            ) : (
              <span className="badge badge--neutral">Đã tùy chỉnh gu riêng</span>
            )}
          </div>

          {/* Chọn mức đường */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-muted mb-1">Độ ngọt (Mức đường):</div>
            <div className="pill-group" role="group" aria-label="Mức đường">
              {SUGAR_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={`pill-btn ${selectedSugar === opt.code ? 'pill-btn--active' : ''}`}
                  aria-pressed={selectedSugar === opt.code}
                  data-testid={`sugar-${opt.code}`}
                  onClick={() => { setSelectedSugar(opt.code); setAddedSuccess(false); }}
                  disabled={isOutOfStock}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn mức đá */}
          <div>
            <div className="text-xs font-semibold text-muted mb-1">Lượng đá:</div>
            <div className="pill-group" role="group" aria-label="Lượng đá">
              {ICE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={`pill-btn ${selectedIce === opt.code ? 'pill-btn--active' : ''}`}
                  aria-pressed={selectedIce === opt.code}
                  data-testid={`ice-${opt.code}`}
                  onClick={() => { setSelectedIce(opt.code); setAddedSuccess(false); }}
                  disabled={isOutOfStock}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Ghi chú cấp đơn (Contract Mục 5.1: deliveryNote cấp đơn, không nhét vào selectedToppings) */}
      <div className="option-group">
        <label className="form-label" htmlFor="product-delivery-note">
          Ghi chú đơn hàng (tùy chọn)
        </label>
        <input
          id="product-delivery-note"
          type="text"
          className="form-input"
          placeholder="VD: Giao tại bàn số 4..."
          value={noteInput}
          onChange={(e) => {
            setNoteInput(e.target.value);
            setDeliveryNote(e.target.value);
          }}
          disabled={isOutOfStock}
          data-testid="product-note"
        />
        <p className="form-hint">
          Ghi chú áp dụng cho toàn bộ đơn hàng. Mức đường và đá được lưu riêng cho từng món.
        </p>
      </div>

      {/* 4. Số lượng & Tạm tính */}
      <div className="option-summary-bar">
        <div className="qty-control" aria-label="Số lượng món">
          <button
            type="button"
            className="qty-btn"
            onClick={handleDecreaseQty}
            disabled={isOutOfStock || quantity <= 1}
            data-testid="qty-decrease"
            aria-label="Giảm số lượng"
          >
            −
          </button>
          <span className="qty-value" data-testid="qty-value">
            {quantity}
          </span>
          <button
            type="button"
            className="qty-btn"
            onClick={handleIncreaseQty}
            disabled={isOutOfStock || quantity >= maxStock}
            data-testid="qty-increase"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>

        <div className="price-preview-box">
          <div className="price-preview__unit">
            Đơn giá:{' '}
            <span data-testid="unit-price-preview">{formatVnd(unitPrice)}</span>
          </div>
          <div className="price-preview__total">
            Tạm tính:{' '}
            <strong className="text-accent" data-testid="item-total-preview">
              {formatVnd(itemTotal)}
            </strong>
          </div>
        </div>
      </div>

      <p className="form-hint mt-1">
        * Giá hiển thị trên ứng dụng chỉ mang tính tạm tính. Tổng tiền thanh toán chính thức do máy chủ quyết định.
      </p>

      {/* 5. Nút Thêm vào giỏ hàng */}
      <button
        type="button"
        className="btn btn--block btn--primary btn--lg mt-2"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        data-testid="add-to-cart-btn"
      >
        {isOutOfStock
          ? 'Tạm hết hàng'
          : `Thêm vào giỏ hàng • ${formatVnd(itemTotal)}`}
      </button>

      {/* 6. Thông báo xác nhận sau khi thêm */}
      {addedSuccess && (
        <div
          className="alert alert--success mt-2"
          data-testid="added-to-cart-feedback"
          role="status"
        >
          <div>
            ✅ Đã thêm <strong>{quantity}x {product.name}</strong> ({selectedSize}
            {selectedToppings.length > 0
              ? `, ${selectedToppings.join(', ')}`
              : ''}
            ) vào giỏ hàng!
          </div>
          <div className="cart-feedback-actions mt-2">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={openDrawer}
              data-testid="open-cart-drawer-btn"
            >
              Mở ngăn giỏ hàng
            </button>
            <Link
              href="/cart"
              className="btn btn--secondary btn--sm"
              data-testid="goto-cart-link"
            >
              Xem giỏ hàng
            </Link>
            <Link
              href="/checkout"
              className="btn btn--primary btn--sm"
              data-testid="goto-checkout-link"
            >
              Thanh toán ngay →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProductOptionSelector;

