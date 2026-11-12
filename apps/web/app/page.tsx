'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import { Empty, Error, Loading } from '../components/States';

type Status = 'loading' | 'success' | 'error';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả món', icon: '✨' },
  { key: 'Coffee', label: 'Cà phê', icon: '☕' },
  { key: 'Tea', label: 'Trà & Trà sữa', icon: '🍵' },
  { key: 'Pastry', label: 'Bánh ngọt', icon: '🥐' },
];

export default function MenuPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description ? p.description.toLowerCase().includes(query) : false);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <main className="page menu-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-banner__overlay">
          <div className="hero-banner__content">
            <span className="hero-banner__badge">☕ Rang xay mộc nguyên bản 100%</span>
            <h1 className="hero-banner__title">BrewLite Coffee & Tea</h1>
            <p className="hero-banner__subtitle">
              Đánh thức mọi giác quan với hương vị cà phê Robusta tuyển chọn và các dòng trà trái cây thanh nhiệt. Đặt món nhanh, nhận đồ uống chuẩn gu trong 15 phút!
            </p>
            <div className="hero-banner__features">
              <span className="hero-feature">⚡ Pha chế tại quầy</span>
              <span className="hero-feature">🌱 Nguyên liệu tươi mới</span>
              <span className="hero-feature">🛵 Giao hàng tận nơi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Filters & Search Header */}
      <header className="page__header menu-header">
        <div>
          <h2 className="page__title">Thực đơn hôm nay</h2>
          <p className="page__subtitle">Chọn thức uống và món bánh yêu thích của bạn</p>
        </div>

        {/* Live Search */}
        <div className="search-bar">
          <span className="search-bar__icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="search-bar__input"
            placeholder="Tìm cà phê, trà đào, matcha, croissant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-bar__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Category Pills */}
      <div className="category-tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.key}
            className={`category-tab ${selectedCategory === cat.key ? 'category-tab--active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            <span className="category-tab__icon">{cat.icon}</span>
            <span className="category-tab__label">{cat.label}</span>
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading label="Loading menu…" />}

      {status === 'error' && (
        <Error message="We couldn't load the menu." onRetry={load} />
      )}

      {status === 'success' && products.length === 0 && (
        <Empty
          title="Menu is empty"
          message="No products are available right now. Check back soon."
        />
      )}

      {status === 'success' && products.length > 0 && filteredProducts.length === 0 && (
        <div className="state empty-filter-state">
          <div className="state__icon">🔍</div>
          <h3 className="state__title">Không tìm thấy món phù hợp</h3>
          <p className="page__subtitle">
            Không có kết quả nào cho từ khóa &quot;{searchQuery}&quot;. Thử tìm món khác hoặc bấm xem tất cả!
          </p>
          <button
            type="button"
            className="btn btn--primary mt-3"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
          >
            Xem tất cả thực đơn
          </button>
        </div>
      )}

      {status === 'success' && filteredProducts.length > 0 && (
        <div className="grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
