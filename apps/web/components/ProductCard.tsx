import Link from 'next/link';
import type { Product } from '../lib/types';

/** Mobile-first catalog card linking to the product detail page. */
export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="card">
      {/* Plain <img>: seed imageUrl hosts are remote/placeholder, so avoid
          next/image remote-host build configuration. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="card__image"
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
      />
      <div className="card__body">
        <h2 className="card__name">{product.name}</h2>
        <p className="card__category">{product.category}</p>
        <p className="card__price">${product.basePrice}</p>
        {!product.isAvailable && (
          <span className="card__badge">Out of stock</span>
        )}
      </div>
    </Link>
  );
}
