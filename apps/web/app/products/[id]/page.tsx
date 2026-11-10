'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import ProductOptionSelector from '../../../components/ProductOptionSelector';
import { Empty, Error, Loading } from '../../../components/States';
import { ApiError, fetchProduct } from '../../../lib/api';
import { formatVnd } from '../../../lib/format';
import type { Product } from '../../../lib/types';

type Status = 'loading' | 'success' | 'notfound' | 'error';

function isThenable(value: unknown): value is Promise<{ id: string }> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

export default function ProductDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = isThenable(params)
    ? use(params)
    : (params as unknown as { id?: string } | undefined);
  const id = resolvedParams?.id ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [product, setProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchProduct(id);
      setProduct(data);
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStatus('notfound');
      } else {
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page" data-testid="product-detail-page">
      <div className="detail-nav">
        <Link href="/" className="back-link">
          ← Back to menu
        </Link>
        <Link href="/cart" className="back-link" data-testid="detail-cart-link">
          🛒 Giỏ hàng
        </Link>
      </div>

      {status === 'loading' && <Loading label="Loading product…" />}

      {status === 'error' && (
        <Error message="We couldn't load this product." onRetry={load} />
      )}

      {status === 'notfound' && (
        <Empty
          title="Product not found"
          message="This item doesn't exist or is no longer available."
        />
      )}

      {status === 'success' && product && (
        <article className="detail-card" data-testid="product-detail-article">
          <div className="detail-card__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="detail__image"
              src={product.imageUrl}
              alt={product.name}
            />
          </div>

          <div className="detail-card__content">
            <div className="detail-card__header">
              <div>
                <p className="card__category">{product.category}</p>
                <h1 className="detail__name">{product.name}</h1>
              </div>
              <p className="detail__price" data-testid="product-base-price">
                {formatVnd(product.basePrice)}
              </p>
            </div>

            <p className="detail__description">{product.description}</p>

            <div className="detail-card__stock">
              {!product.isAvailable || product.stockQuantity <= 0 ? (
                <span className="card__badge" data-testid="out-of-stock-badge">
                  Out of stock
                </span>
              ) : (
                <span className="badge badge--success" data-testid="in-stock-badge">
                  Còn {product.stockQuantity} phần
                </span>
              )}
            </div>

            <ProductOptionSelector product={product} />
          </div>
        </article>
      )}
    </main>
  );
}
