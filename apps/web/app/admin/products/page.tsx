'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '../../../lib/api';
import { formatVnd } from '../../../lib/format';
import type { Product } from '../../../lib/types';
import { Loading } from '../../../components/States';

const SAMPLE_IMAGES = [
  { label: 'Cà phê sữa', url: '/img/caphesua.jpg' },
  { label: 'Americano', url: '/img/americano.jpg' },
  { label: 'Cappuccino', url: '/img/cappuccino.jpg' },
  { label: 'Cold Brew', url: '/img/coldbrew.jpg' },
  { label: 'Trà đào', url: '/img/tradao.jpg' },
  { label: 'Matcha Latte', url: '/img/matchalatte.jpg' },
  { label: 'Bánh Croissant', url: '/img/croissant.jpg' },
];

export default function AdminProductsPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyProductIds, setBusyProductIds] = useState<string[]>([]);
  const [loginPending, setLoginPending] = useState(false);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Coffee');
  const [formPrice, setFormPrice] = useState<string>('40000');
  const [formStock, setFormStock] = useState<string>('100');
  const [formImage, setFormImage] = useState<string>('/img/caphesua.jpg');
  const [formDesc, setFormDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAdmin =
    isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await fetchProducts({ fallbackOnNetworkError: false });
      setProducts(data);
    } catch {
      setActionError('Không thể tải danh sách sản phẩm từ máy chủ API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void loadData();
  }, [authLoading, isAdmin, loadData]);

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) setIsModalOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, isSubmitting]);

  // Auto generate code from name
  const handleNameChange = (val: string, category = formCategory) => {
    setFormName(val);
    if (!formCode || formCode.startsWith('CF-') || formCode.startsWith('TEA-') || formCode.startsWith('PAS-')) {
      const prefix = category === 'Coffee' ? 'CF' : category === 'Tea' ? 'TEA' : 'PAS';
      const cleanSlug = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 8);
      if (cleanSlug) {
        setFormCode(`${prefix}-${cleanSlug}`);
      }
    }
  };

  const handleToggleAvailability = async (p: Product) => {
    if (!token || busyProductIds.includes(p.id)) return;
    setBusyProductIds((previous) => [...previous, p.id]);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await updateProduct(p.id, { isAvailable: !p.isAvailable }, token);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? updated : item,
        ),
      );
      setActionSuccess(`Đã cập nhật trạng thái món "${p.name}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật';
      setActionError(msg);
    } finally {
      setBusyProductIds((previous) => previous.filter((id) => id !== p.id));
    }
  };

  const handleDelete = async (p: Product) => {
    if (!token || busyProductIds.includes(p.id)) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${p.name}"?`)) return;
    setBusyProductIds((previous) => [...previous, p.id]);
    setActionError(null);
    try {
      await deleteProduct(p.id, token);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      setActionSuccess(`Đã xóa món "${p.name}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa món';
      setActionError(msg);
    } finally {
      setBusyProductIds((previous) => previous.filter((id) => id !== p.id));
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setActionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!formName.trim() || !formCode.trim()) {
      setActionError('Vui lòng nhập tên món và mã sản phẩm.');
      return;
    }

    const priceNum = Number(formPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setActionError('Giá bán phải là số tiền hợp lệ (> 0đ).');
      return;
    }
    const stockNum = Number(formStock);
    if (!formStock.trim() || !Number.isSafeInteger(stockNum) || stockNum < 0 || stockNum > 2147483647) {
      setActionError('Tồn kho phải là số nguyên từ 0 đến 2.147.483.647.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const newProd = await createProduct(
        {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDesc.trim(),
          basePrice: priceNum,
          category: formCategory,
          imageUrl: formImage.trim() || '/img/caphesua.jpg',
          stockQuantity: stockNum,
          isAvailable: true,
        },
        token,
      );

      setProducts((prev) => [newProd, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setFormName('');
      setFormCode('');
      setFormDesc('');
      setFormCategory('Coffee');
      setFormPrice('40000');
      setFormStock('100');
      setFormImage('/img/caphesua.jpg');
      setActionSuccess(`Đã thêm món mới "${newProd.name}" thành công!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo sản phẩm';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      return (
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable && p.stockQuantity > 0).length;
    const outOfStock = total - available;
    return { total, available, outOfStock };
  }, [products]);

  // Demo auto-login for testing convenience
  const handleQuickAdminLogin = async () => {
    setActionError(null);
    setLoginPending(true);
    try {
      await login({
        email: 'admin@brewlite.vn',
        password: 'Password123!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập admin thất bại';
      setActionError(msg);
    } finally {
      setLoginPending(false);
    }
  };

  if (authLoading) {
    return <Loading label="Đang kiểm tra quyền quản trị..." />;
  }

  // Access Guard Screen if not Admin
  if (!isAdmin) {
    return (
      <main className="admin-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem 1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff3e0', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
            Khu Vực Dành Cho Quản Trị Viên
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Trang này chỉ dành cho tài khoản có quyền <strong>Quản trị viên (ADMIN)</strong> hoặc Quản lý cửa hàng (MANAGER).
          </p>

          <div style={{ background: '#faf7f2', border: '1px dashed #ebd9c8', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.35rem' }}>🔑 Tài khoản Admin dùng thử:</div>
            <div>• Email: <strong>admin@brewlite.vn</strong></div>
            <div>• Mật khẩu: <strong>Password123!</strong></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {actionError && <p role="alert" className="text-danger">{actionError}</p>}
            <button
              type="button"
              disabled={loginPending}
              onClick={handleQuickAdminLogin}
              className="btn btn--primary"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700 }}
            >
              <Sparkles size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
              <span>{loginPending ? 'Đang đăng nhập...' : 'Đăng nhập 1-chạm bằng tài khoản Admin'}</span>
            </button>
            <Link
              href="/login?redirect=/admin/products"
              className="btn btn--secondary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '999px' }}
            >
              Đăng nhập bằng tài khoản khác
            </Link>
            <Link
              href="/"
              style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem', textDecoration: 'underline' }}
            >
              Quay lại Thực đơn
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-container" data-testid="admin-products-page">
      {/* Admin Header */}
      <header className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--accent" style={{ background: '#f5e0cf', color: '#9d592b', border: '1px solid #ecc9ad' }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Quản Trị Hệ Thống
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong>
            </span>
          </div>
          <h1 className="admin-header__title">Quản Trị Thực Đơn BrewLite</h1>
          <p className="admin-header__subtitle">
            Thêm thức uống mới, điều chỉnh giá bán và cập nhật trạng thái kho tức thời.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/"
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Xem Menu</span>
          </Link>
          <button
            type="button"
            onClick={() => { setActionError(null); setIsModalOpen(true); }}
            className="btn btn--primary"
            style={{ borderRadius: '999px', fontWeight: 700, fontSize: '0.88rem' }}
            data-testid="admin-add-product-btn"
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Thêm món mới</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {actionSuccess && (
        <div role="status" style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && !isModalOpen && (
        <div role="alert" style={{ background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertTriangle size={16} />
          <span>{actionError}</span>
          <button type="button" className="btn btn--secondary" onClick={() => void loadData()}>Thử lại</button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#f5e0cf', color: '#9d592b' }}>
            <Coffee size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.total}</div>
            <div className="admin-stat-card__label">Tổng số món</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.available}</div>
            <div className="admin-stat-card__label">Đang phục vụ</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#ffebee', color: '#c62828' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.outOfStock}</div>
            <div className="admin-stat-card__label">Tạm hết hàng</div>
          </div>
        </div>
      </section>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div className="search-bar" style={{ maxWidth: '380px', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={16} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Tìm theo tên món hoặc mã SKU..."
            aria-label="Tìm kiếm sản phẩm quản trị"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} món
        </span>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <Loading label="Đang cập nhật thực đơn..." />
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Phân loại</th>
                <th>Đơn giá gốc</th>
                <th>Tồn kho</th>
                <th>Trạng thái bán</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isOutOfStock = !p.isAvailable || p.stockQuantity <= 0;

                return (
                  <tr key={p.id} data-testid={`admin-product-${p.code}`}>
                    <td>
                      <div className="admin-prod-info">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="admin-prod-thumb"
                        />
                        <div>
                          <span className="admin-prod-name">{p.name}</span>
                          <span className="admin-prod-sku">{p.code}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--neutral">
                        {p.category === 'Coffee'
                          ? 'Cà phê'
                          : p.category === 'Tea'
                            ? 'Trà & Trà sữa'
                            : 'Bánh ngọt'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent)' }}>
                        {formatVnd(p.basePrice)}
                      </strong>
                    </td>
                    <td>
                      <span>{p.stockQuantity} {p.category === 'Pastry' ? 'phần' : 'ly'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={busyProductIds.includes(p.id) || p.stockQuantity <= 0}
                        aria-label={`${isOutOfStock ? 'Bật bán' : 'Tạm hết hàng'} ${p.name}`}
                        aria-pressed={!isOutOfStock}
                        data-testid={`admin-toggle-${p.code}`}
                        onClick={() => handleToggleAvailability(p)}
                        className={`admin-toggle-btn ${
                          !isOutOfStock
                            ? 'admin-toggle-btn--available'
                            : 'admin-toggle-btn--unavailable'
                        }`}
                        title={p.stockQuantity <= 0 ? 'Không còn tồn kho để bật bán' : 'Bấm để đổi trạng thái bán'}
                      >
                        {!isOutOfStock ? (
                          <>
                            <CheckCircle size={12} />
                            <span>Còn hàng</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Hết hàng</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        disabled={busyProductIds.includes(p.id)}
                        onClick={() => handleDelete(p)}
                        className="admin-delete-btn"
                        title={`Xóa món ${p.name}`}
                        aria-label={`Xóa ${p.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Không tìm thấy sản phẩm phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Thêm Món Mới */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 id="admin-product-modal-title" className="admin-modal__title">Thêm Món Mới Vào Thực Đơn</h2>
              <button
                type="button"
                aria-label="Đóng biểu mẫu thêm món"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              {actionError && <p role="alert" className="text-danger">{actionError}</p>}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="prod-name">
                  Tên món đồ uống / bánh *
                </label>
                <input
                  id="prod-name"
                  type="text"
                  className="form-input"
                  placeholder="VD: Trà Sữa Oolong Nướng Kem Cheese"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="admin-modal__form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-code">
                    Mã sản phẩm (SKU) *
                  </label>
                  <input
                    id="prod-code"
                    type="text"
                    className="form-input"
                    placeholder="VD: TEA-OOLONG"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-cat">
                    Danh mục *
                  </label>
                  <select
                    id="prod-cat"
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      handleNameChange(formName, e.target.value);
                    }}
                  >
                    <option value="Coffee">Cà phê (Coffee)</option>
                    <option value="Tea">Trà & Trà sữa (Tea)</option>
                    <option value="Pastry">Bánh ngọt (Pastry)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal__form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-price">
                    Giá bán gốc (₫) *
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    placeholder="45000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-stock">
                    Số lượng tồn kho ban đầu
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    className="form-input"
                    placeholder="100"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                </div>
              </div>

              {/* Ảnh đại diện & Mẫu ảnh nhanh */}
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="prod-img">
                  Link ảnh sản phẩm
                </label>
                <input
                  id="prod-img"
                  type="text"
                  className="form-input"
                  placeholder="/img/caphesua.jpg hoặc https://..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                />
                <div style={{ marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    Chọn nhanh ảnh mẫu chuẩn BrewLite:
                  </span>
                  <div className="sample-image-pills">
                    {SAMPLE_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setFormImage(img.url)}
                        className={`sample-image-pill ${
                          formImage === img.url ? 'sample-image-pill--active' : ''
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" htmlFor="prod-desc">
                  Mô tả món
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  className="form-input"
                  placeholder="Hương vị đậm đà, thơm lừng béo ngậy..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn--secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn--primary"
                  style={{ fontWeight: 700 }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu món vào thực đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
