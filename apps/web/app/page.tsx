'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import { Empty, Error, Loading } from '../components/States';

type Status = 'loading' | 'success' | 'error';

export default function MenuPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchProducts();
      setProducts(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">BrewLite Menu</h1>
        <p className="page__subtitle">Freshly brewed, made to order.</p>
      </header>

      {status === 'loading' && <Loading label="Loading menu…" />}

      {status === 'error' && (
        <Error message="We couldn't load the menu." onRetry={load} />
      )}

      {status === 'success' &&
        (products.length === 0 ? (
          <Empty
            title="Menu is empty"
            message="No products are available right now. Check back soon."
          />
        ) : (
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ))}
    </main>
  );
}
