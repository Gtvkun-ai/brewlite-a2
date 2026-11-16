'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  X,
  AlertTriangle,
  Lock,
  Percent,
  DollarSign,
  Calendar,
  Coffee,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  Promotion,
} from '../../../lib/promotions-api';
import { formatVnd } from '../../../lib/format';
import { Loading } from '../../../components/States';

export default function AdminPromotionsPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // Form State
  const [formCode, setFormCode] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formType, setFormType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [formValue, setFormValue] = useState<string>('20');
  const [formMinOrder, setFormMinOrder] = useState<string>('40000');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('30000');
  const [formValidFrom, setFormValidFrom] = useState<string>('2026-01-01');
  const [formValidTo, setFormValidTo] = useState<string>('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isDevMode = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin =
    isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const loadPromos = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await fetchPromotions(false, token ?? undefined);
      setPromotions(data);
    } catch {
      setActionError('Không thể tải danh sách khuyến mãi.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      void loadPromos();
    }
  }, [isAdmin, loadPromos]);

  const handleToggleActive = async (p: Promotion) => {
    if (!token) return;
    try {
      const updated = await updatePromotion(p.id, { isActive: !p.isActive }, token);
      setPromotions((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: updated.isActive } : item)),
      );
      setActionSuccess(`Đã cập nhật trạng thái mã "${p.code}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật khuyến mãi';
      setActionError(msg);
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!token) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa mã khuyến mãi "${p.code}"?`)) return;

    try {
      await deletePromotion(p.id, token);
      setPromotions((prev) => prev.filter((item) => item.id !== p.id));
      setActionSuccess(`Đã xóa mã khuyến mãi "${p.code}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa mã';
      setActionError(msg);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setActionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (!formCode.trim() || !formDesc.trim()) {
      setActionError('Vui lòng nhập đầy đủ mã và mô tả khuyến mãi.');
      return;
    }

    const valNum = Number(formValue);
    if (isNaN(valNum) || valNum <= 0) {
      setActionError('Giá trị khuyến mãi không hợp lệ (> 0).');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const newPromo = await createPromotion(
        {
          code: formCode.trim().toUpperCase(),
          description: formDesc.trim(),
          type: formType,
          value: valNum,
          minOrderValue: Number(formMinOrder) || 0,
          maxDiscount: formType === 'PERCENTAGE' && formMaxDiscount ? Number(formMaxDiscount) : undefined,
          validFrom: new Date(formValidFrom).toISOString(),
          validTo: new Date(`${formValidTo}T23:59:59.000Z`).toISOString(),
          isActive: true,
        },
        token,
      );

      setPromotions((prev) => [newPromo, ...prev]);
      setIsModalOpen(false);
      setFormCode('');
      setFormDesc('');
      setActionSuccess(`Đã tạo mã khuyến mãi "${newPromo.code}" thành công!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo mã khuyến mãi';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo auto-login for testing convenience
  const handleQuickAdminLogin = async () => {
    try {
      setIsLoading(true);
      await login({
        email: 'admin@brewlite.vn',
        password: 'Password123!',
      });
      await loadPromos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập admin thất bại';
      setActionError(msg);
    } finally {
      setIsLoading(false);
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
            <Tag size={28} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
            Quản Trị Khuyến Mãi & Voucher
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Trang này chỉ dành cho tài khoản có quyền <strong>Quản trị viên (ADMIN)</strong> hoặc Quản lý cửa hàng (MANAGER).
          </p>

          {isDevMode ? (
            <>
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', textAlign: 'left', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#b78103', marginBottom: '0.35rem' }}>
                  <Lock size={14} />
                  <span>🔑 Tài khoản Admin dùng thử (Chỉ hiện ở Dev Mode):</span>
                </div>
                <div>• Email: <strong>admin@brewlite.vn</strong></div>
                <div>• Mật khẩu: <strong>Password123!</strong></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  className="btn btn--primary"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700 }}
                >
                  <Sparkles size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  <span>Đăng nhập 1-chạm (Dev Mode)</span>
                </button>
                <Link
                  href="/"
                  style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem', textDecoration: 'underline' }}
                >
                  Quay lại Thực đơn
                </Link>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#c62828', background: '#ffebee', padding: '0.75rem', borderRadius: '8px' }}>
                Vui lòng đăng nhập bằng tài khoản Quản trị viên được cấp phép.
              </p>
              <Link
                href="/login"
                className="btn btn--primary"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700 }}
              >
                Chuyển đến Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="admin-container" data-testid="admin-promotions-page">
      {/* Header */}
      <header className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--accent" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f8bbd0' }}>
              <Tag size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Chương Trình Khuyến Mãi
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong>
            </span>
          </div>
          <h1 className="admin-header__title">Quản Trị Mã Giảm Giá & Voucher</h1>
          <p className="admin-header__subtitle">
            Tạo mã coupon tri ân khách hàng, thiết lập mức giảm theo % hoặc tiền mặt và thời hạn sử dụng.
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
            onClick={() => setIsModalOpen(true)}
            className="btn btn--primary"
            style={{ borderRadius: '999px', fontWeight: 700, fontSize: '0.88rem' }}
            data-testid="admin-add-promo-btn"
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Tạo mã mới</span>
          </button>
        </div>
      </header>

      {/* Sub-navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Phân hệ Quản trị">
        <Link
          href="/admin/dashboard"
          className="admin-nav-tab"
          data-testid="admin-tab-dashboard"
        >
          <BarChart3 size={16} />
          <span>Dashboard Doanh Thu</span>
        </Link>
        <Link
          href="/admin/orders"
          className="admin-nav-tab"
          data-testid="admin-tab-orders"
        >
          <ClipboardList size={16} />
          <span>Đơn hàng & KDS Barista</span>
        </Link>
        <Link
          href="/admin/products"
          className="admin-nav-tab"
          data-testid="admin-tab-products"
        >
          <Coffee size={16} />
          <span>Quản lý Thực đơn</span>
        </Link>
        <Link
          href="/admin/promotions"
          className="admin-nav-tab admin-nav-tab--active"
          data-testid="admin-tab-promotions"
        >
          <Tag size={16} />
          <span>Mã Khuyến Mãi</span>
        </Link>
      </nav>

      {/* Notifications */}
      {actionSuccess && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Promotions Table */}
      {isLoading ? (
        <Loading label="Đang tải danh sách khuyến mãi..." />
      ) : promotions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Tag size={40} style={{ color: 'var(--muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem' }}>Chưa có mã khuyến mãi nào</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Nhấn nút &quot;Tạo mã mới&quot; ở góc trên bên phải để bắt đầu chiến dịch ưu đãi.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Mô tả chi tiết</th>
                <th>Hình thức giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Thời hạn áp dụng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => {
                const isPercentage = p.type === 'PERCENTAGE';
                const formattedValidTo = new Date(p.validTo).toLocaleDateString('vi-VN');

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Tag size={14} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {p.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{p.description}</span>
                    </td>
                    <td>
                      <span className={`badge ${isPercentage ? 'badge--accent' : 'badge--neutral'}`} style={{ fontWeight: 700 }}>
                        {isPercentage ? (
                          <>
                            <Percent size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                            Giảm {p.value}% {p.maxDiscount ? `(tối đa ${formatVnd(p.maxDiscount)})` : ''}
                          </>
                        ) : (
                          <>
                            <DollarSign size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                            Giảm {formatVnd(p.value)}
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {Number(p.minOrderValue) > 0 ? `Từ ${formatVnd(p.minOrderValue)}` : 'Mọi đơn hàng'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        <Calendar size={12} />
                        <span>Đến {formattedValidTo}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`admin-toggle-btn ${
                          p.isActive
                            ? 'admin-toggle-btn--available'
                            : 'admin-toggle-btn--unavailable'
                        }`}
                        title="Click để đổi trạng thái kích hoạt"
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle size={12} />
                            <span>Đang bật</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Tạm dừng</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="admin-delete-btn"
                        title={`Xóa mã ${p.code}`}
                        aria-label={`Xóa ${p.code}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Tạo Mã Khuyến Mãi Mới (React Portal) */}
      {mounted && isModalOpen && createPortal(
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Tạo Mã Khuyến Mãi Mới</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePromo}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="promo-code">
                  Mã Voucher (Code) *
                </label>
                <input
                  id="promo-code"
                  type="text"
                  className="form-input"
                  placeholder="VD: BANMOI20 hoặc COFFEE10K"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="promo-desc">
                  Mô tả ưu đãi *
                </label>
                <input
                  id="promo-desc"
                  type="text"
                  className="form-input"
                  placeholder="VD: Giảm 20% tối đa 30.000đ cho đơn hàng mới"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="promo-type">
                    Hình thức giảm giá *
                  </label>
                  <select
                    id="promo-type"
                    className="form-input"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                  >
                    <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Giảm số tiền cố định (₫)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="promo-value">
                    {formType === 'PERCENTAGE' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (₫) *'}
                  </label>
                  <input
                    id="promo-value"
                    type="number"
                    className="form-input"
                    placeholder={formType === 'PERCENTAGE' ? '20' : '15000'}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="promo-min-order">
                    Đơn hàng tối thiểu (₫)
                  </label>
                  <input
                    id="promo-min-order"
                    type="number"
                    step="1000"
                    className="form-input"
                    placeholder="40000"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                  />
                </div>

                {formType === 'PERCENTAGE' ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="promo-max-discount">
                      Mức giảm tối đa (₫)
                    </label>
                    <input
                      id="promo-max-discount"
                      type="number"
                      step="1000"
                      className="form-input"
                      placeholder="30000"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    <span>Giảm trực tiếp số tiền vào tổng bill.</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="promo-valid-from">
                    Hiệu lực từ ngày *
                  </label>
                  <input
                    id="promo-valid-from"
                    type="date"
                    className="form-input"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="promo-valid-to">
                    Hết hạn vào ngày *
                  </label>
                  <input
                    id="promo-valid-to"
                    type="date"
                    className="form-input"
                    value={formValidTo}
                    onChange={(e) => setFormValidTo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
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
                  {isSubmitting ? 'Đang tạo...' : 'Lưu mã khuyến mãi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}
