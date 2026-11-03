'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import { ApiError, fetchProduct } from '../../../lib/api';
import type { Product } from '../../../lib/types';
import { Empty, Error, Loading } from '../../../components/States';

type Status = 'loading' | 'success' | 'notfound' | 'error';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
    <main className="page">
      <Link href="/" className="back-link">
        ← Back to menu
      </Link>

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
        <article>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="detail__image"
            src={product.imageUrl}
            alt={product.name}
          />
          <h1 className="detail__name">{product.name}</h1>
          <p className="card__category">{product.category}</p>
          <p className="detail__price">${product.basePrice}</p>
          <p className="detail__description">{product.description}</p>
          {!product.isAvailable && (
            <span className="card__badge">Out of stock</span>
          )}
        </article>
      )}
    </main>
  );
}
