'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coffee,
  CupSoda,
  Croissant,
  LayoutGrid,
  Search,
  X,
  Sparkles,
  Zap,
  Sprout,
  Truck,
} from 'lucide-react';
import { fetchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import { Empty, Error, Loading } from '../components/States';

type Status = 'loading' | 'success' | 'error';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả món', icon: LayoutGrid },
  { key: 'Coffee', label: 'Cà phê', icon: Coffee },
  { key: 'Tea', label: 'Trà & Trà sữa', icon: CupSoda },
  { key: 'Pastry', label: 'Bánh ngọt', icon: Croissant },
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
      {/* Hero Banner Specialty Style */}
      <section className="hero-banner">
        <div className="hero-banner__glow-1" />
        <div className="hero-banner__glow-2" />
        <div className="hero-banner__overlay">
          <div className="hero-banner__content">
            <div className="hero-banner__badge">
              <Sparkles size={14} className="hero-banner__badge-icon" />
              <span>Rang xay mộc nguyên bản 100% Arabica & Robusta</span>
            </div>
            <h1 className="hero-banner__title">
              BrewLite Coffee <span className="hero-banner__title-accent">& Tea</span>
            </h1>
            <p className="hero-banner__subtitle">
              Đánh thức mọi giác quan với hương vị cà phê Robusta tuyển chọn và các dòng trà trái cây thanh nhiệt. Đặt món nhanh, nhận đồ uống chuẩn gu trong 15 phút!
            </p>
            <div className="hero-banner__features">
              <span className="hero-feature">
                <Zap size={14} className="hero-feature__icon" />
                <span>Pha chế tại quầy</span>
              </span>
              <span className="hero-feature">
                <Sprout size={14} className="hero-feature__icon" />
                <span>Nguyên liệu tươi mới</span>
              </span>
              <span className="hero-feature">
                <Truck size={14} className="hero-feature__icon" />
                <span>Giao hàng tận nơi</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Filters & Search Header */}
      <header className="page__header menu-header">
        <div className="menu-header__titles">
          <h2 className="page__title">Thực đơn hôm nay</h2>
          <p className="page__subtitle">Chọn thức uống và món bánh yêu thích của bạn</p>
        </div>

        {/* Live Search Bar */}
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" aria-hidden="true" />
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
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Category Pills */}
      <nav className="category-tabs" aria-label="Bộ lọc danh mục món">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`category-tab ${isActive ? 'category-tab--active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <Icon size={16} className="category-tab__icon" />
              <span>{cat.label}</span>
              {cat.key !== 'ALL' && (
                <span className="category-tab__count">
                  {products.filter((p) => p.category.toLowerCase() === cat.key.toLowerCase()).length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* States or Catalog Grid */}
      {status === 'loading' && <Loading label="Loading menu…" />}
      {status === 'error' && (
        <Error
          message="Không thể kết nối với máy chủ API. Vui lòng kiểm tra mạng hoặc thử lại."
          onRetry={load}
        />
      )}
      {status === 'success' && products.length === 0 && (
        <Empty
          title="Menu is empty"
          message="Hiện chưa có món nào trong thực đơn. Vui lòng quay lại sau."
        />
      )}
      {status === 'success' && products.length > 0 && filteredProducts.length === 0 && (
        <Empty
          title="Không tìm thấy món phù hợp"
          message={`Không có kết quả nào cho "${searchQuery}". Hãy thử tìm tên khác hoặc chọn lại danh mục.`}
        />
      )}
      {status === 'success' && filteredProducts.length > 0 && (
        <section className="product-grid" data-testid="product-grid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </section>
      )}
    </main>
  );
}
