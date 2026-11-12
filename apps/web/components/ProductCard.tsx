import Link from 'next/link';
import { formatVnd } from '../lib/format';
import type { Product } from '../lib/types';

/** Mobile-first catalog card linking to the product detail page. */
export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`card ${isOutOfStock ? 'card--out-of-stock' : ''}`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="card__media">
        {/* Plain <img>: seed imageUrl hosts are remote/placeholder, so avoid
            next/image remote-host build configuration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="card__image"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
        {isOutOfStock ? (
          <span className="card__badge card__badge--soldout">Tạm hết hàng</span>
        ) : (
          <span className="card__badge card__badge--tag">
            {product.category === 'Coffee'
              ? '☕ Best Seller'
              : product.category === 'Tea'
                ? '🍵 Thanh mát'
                : '🥐 Tươi mới'}
          </span>
        )}
      </div>

      <div className="card__body">
        <div className="card__meta">
          <span className="card__category">{product.category}</span>
          {!isOutOfStock && (
            <span className="card__stock">Còn {product.stockQuantity}</span>
          )}
        </div>
        <h2 className="card__name">{product.name}</h2>
        {product.description && (
          <p className="card__desc">{product.description}</p>
        )}
        <div className="card__footer">
          <p className="card__price">{formatVnd(product.basePrice)}</p>
          <span className="card__action-btn">
            {isOutOfStock ? 'Hết món' : 'Đặt món +'}
          </span>
        </div>
      </div>
    </Link>
  );
}
