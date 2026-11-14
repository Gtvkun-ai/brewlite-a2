'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  CupSoda,
  Croissant,
  LayoutGrid,
  Search,
  X,
  Zap,
  Flame,
  Leaf,
  Gift,
} from 'lucide-react';
import { fetchProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import QuickOrderModal from '../components/QuickOrderModal';
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      {/* Sleek Specialty Coffee Hero Banner */}
      <section className="hero-compact" aria-label="Giới thiệu BrewLite">
        <div className="hero-compact__badge">
          <Flame size={13} />
          <span>Hạt Mộc Cầu Đất · Rang Xay Tươi Mới Mỗi Ngày</span>
        </div>

        <h1 className="hero-compact__title">
          Ly nước đắng từ gốc, <span>cuộc đời ngọt tại tâm.</span>
        </h1>

        <p className="hero-compact__desc">
          Cà phê rang mộc và trà thơm tuyển chọn mỗi ngày. Một chút ấm áp cho ngày làm việc và học tập tràn đầy cảm hứng tại SGU Campus.
        </p>

        <div className="hero-compact__features">
          <span className="hero-compact__feature-item">
            <Coffee size={14} />
            <span>100% Hạt Mộc Cầu Đất</span>
          </span>
          <span className="hero-compact__feature-item">
            <Zap size={14} />
            <span>Pha Tươi Tại Quầy</span>
          </span>
          <span className="hero-compact__feature-item">
            <Leaf size={14} />
            <span>Trà Thơm Tuyển Chọn</span>
          </span>
          <Link href="/loyalty" className="hero-compact__feature-item" style={{ background: 'rgba(194, 120, 71, 0.25)', borderColor: 'rgba(194, 120, 71, 0.5)' }}>
            <Gift size={14} />
            <span>Tích điểm đổi Voucher</span>
          </Link>
        </div>
      </section>

      {/* Menu Filters & Search Header */}
      <header id="menu-catalog" className="page__header menu-header">
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
              <span className="category-tab__label">{cat.label}</span>
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
        <section className="grid product-grid" data-testid="product-grid">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={setSelectedProduct}
            />
          ))}
        </section>
      )}

      {/* Quick Order Modal (Đặt món trực tiếp trên trang) */}
      {selectedProduct && (
        <QuickOrderModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}
