'use client';

import React, { useEffect } from 'react';
import { X, Coffee, Flame, Leaf, Sparkles } from 'lucide-react';
import { formatVnd } from '../lib/format';
import type { Product } from '../lib/types';
import { useOptionalCart } from '../context/CartContext';
import ProductOptionSelector from './ProductOptionSelector';

export interface QuickOrderModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickOrderModal({ product, onClose }: QuickOrderModalProps) {
  const cart = useOptionalCart();
  const openDrawer = cart?.openDrawer;
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [product, onClose]);

  if (!product) return null;

  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0;

  return (
    <div
      className="quick-order-backdrop"
      onClick={onClose}
      data-testid="quick-order-backdrop"
    >
      <div
        className="quick-order-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-title"
        data-testid="quick-order-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          className="quick-order-modal__close"
          onClick={onClose}
          aria-label="Đóng cửa sổ đặt món"
        >
          <X size={20} />
        </button>

        {/* Product Visual Header */}
        <div className="quick-order-modal__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="quick-order-modal__image"
          />
          <div className="quick-order-modal__badge">
            {product.category === 'Coffee' ? (
              <span className="badge badge--accent">
                <Flame size={12} className="inline mr-1 text-amber-500" />
                Cà phê nguyên chất
              </span>
            ) : product.category === 'Tea' ? (
              <span className="badge badge--accent">
                <Leaf size={12} className="inline mr-1 text-emerald-500" />
                Trà thanh mát
              </span>
            ) : (
              <span className="badge badge--accent">
                <Sparkles size={12} className="inline mr-1 text-orange-500" />
                Bánh thủ công
              </span>
            )}
          </div>
        </div>

        {/* Product Info & Options */}
        <div className="quick-order-modal__body">
          <div className="quick-order-modal__header">
            <div>
              <h2 id="modal-product-title" className="quick-order-modal__title">
                {product.name}
              </h2>
              {product.description && (
                <p className="quick-order-modal__desc">{product.description}</p>
              )}
            </div>
            <div className="quick-order-modal__price">
              <span className="text-muted text-xs">Giá gốc:</span>
              <strong className="text-accent text-lg font-bold">
                {formatVnd(product.basePrice)}
              </strong>
            </div>
          </div>

          {/* Option Selector Component (Size, Topping, Quantity, Note, Add To Cart) */}
          <div className="quick-order-modal__options">
            <ProductOptionSelector
              product={product}
              onAdded={() => {
                // Auto close modal and slide open the Cart Drawer
                setTimeout(() => {
                  onClose();
                  openDrawer?.();
                }, 350);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickOrderModal;

