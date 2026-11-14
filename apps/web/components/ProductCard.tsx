import Link from 'next/link';
import { Coffee, Flame, Leaf, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { formatVnd } from '../lib/format';
import type { Product } from '../lib/types';

/** Modern specialty coffee card with micro-interactions. */
export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`card ${isOutOfStock ? 'card--out-of-stock' : ''}`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="card__image"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
        <div className="card__gradient-overlay" />
        
        {isOutOfStock ? (
          <span className="card__badge card__badge--soldout">
            <AlertCircle size={13} />
            <span>Tạm hết hàng</span>
          </span>
        ) : (
          <span className="card__badge card__badge--tag">
            {product.category === 'Coffee' ? (
              <>
                <Flame size={13} className="text-amber-400" />
                <span>Best Seller</span>
              </>
            ) : product.category === 'Tea' ? (
              <>
                <Leaf size={13} className="text-emerald-400" />
                <span>Thanh mát</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-orange-400" />
                <span>Tươi mới</span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="card__body">
        <div className="card__meta">
          <span className="card__category">
            {product.category === 'Coffee' ? 'Cà phê nguyên chất' : product.category === 'Tea' ? 'Trà đặc sản' : 'Bánh thủ công'}
          </span>
          {!isOutOfStock && (
            <span className="card__stock">
              <span className="card__stock-dot" />
              Còn {product.stockQuantity} ly
            </span>
          )}
        </div>
        <h2 className="card__name">{product.name}</h2>
        {product.description && (
          <p className="card__desc">{product.description}</p>
        )}
        <div className="card__footer">
          <div className="card__price-wrap">
            <span className="card__price-label">Giá niêm yết</span>
            <p className="card__price">{formatVnd(product.basePrice)}</p>
          </div>
          <span className="card__action-btn">
            {isOutOfStock ? (
              'Hết món'
            ) : (
              <>
                <span>Đặt món</span>
                <Plus size={16} className="card__action-icon" />
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
