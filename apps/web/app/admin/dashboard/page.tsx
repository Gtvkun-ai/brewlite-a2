'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Coffee,
  ClipboardList,
  Tag,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Lock,
  Sparkles,
  BarChart3,
  Award,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { fetchAnalytics, AnalyticsData } from '../../../lib/orders-api';
import { formatVnd } from '../../../lib/format';
import { Loading } from '../../../components/States';

export default function AdminDashboardPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const isDevMode = process.env.NODE_ENV !== 'production';
  const isAdmin =
    isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetchAnalytics(token ?? undefined);
      setData(res);
    } catch {
      setActionError('Không thể tải dữ liệu báo cáo thống kê. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      void loadData();
    }
  }, [isAdmin, loadData]);

  // Demo auto-login for testing convenience (Dev environment only)
  const handleQuickAdminLogin = async () => {
    try {
      setIsLoading(true);
      await login({
        email: 'admin@brewlite.vn',
        password: 'Password123!',
      });
      await loadData();
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

  // Access Guard Screen if not Admin/Manager
  if (!isAdmin) {
    return (
      <main className="admin-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem 1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff3e0', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BarChart3 size={28} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
            Báo Cáo Doanh Thu Quản Trị
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

  const successRate =
    data && data.totalOrders > 0
      ? Math.round(
          ((data.statusCounts?.COMPLETED || 0) /
            Math.max(1, data.totalOrders - (data.statusCounts?.CANCELLED || 0))) *
            100,
        )
      : 100;

  return (
    <main className="admin-container" data-testid="admin-dashboard-page">
      {/* Header */}
      <header className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--accent" style={{ background: '#f5e0cf', color: '#9d592b', border: '1px solid #ecc9ad' }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Báo Cáo & Vận Hành
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong> ({user?.role})
            </span>
          </div>
          <h1 className="admin-header__title">Trung Tâm Điều Hành & Doanh Thu</h1>
          <p className="admin-header__subtitle">
            Giám sát doanh thu thời gian thực, tỷ lệ xử lý đơn và hiệu suất từng món bán lẻ.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem' }}
            title="Làm mới số liệu báo cáo"
            data-testid="admin-refresh-analytics-btn"
          >
            <RefreshCw
              size={14}
              style={{ display: 'inline', marginRight: '0.35rem' }}
              className={isLoading ? 'animate-spin' : ''}
            />
            <span>Làm mới</span>
          </button>
          <Link
            href="/"
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Xem Menu</span>
          </Link>
        </div>
      </header>

      {/* Sub-navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Phân hệ Quản trị">
        <Link
          href="/admin/dashboard"
          className="admin-nav-tab admin-nav-tab--active"
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
          className="admin-nav-tab"
          data-testid="admin-tab-promotions"
        >
          <Tag size={16} />
          <span>Mã Khuyến Mãi</span>
        </Link>
      </nav>

      {/* Error alert */}
      {actionError && (
        <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {isLoading || !data ? (
        <Loading label="Đang tổng hợp báo cáo kinh doanh..." />
      ) : (
        <>
          {/* KPI Stat Cards */}
          <section className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div className="admin-stat-card__value" style={{ color: '#2e7d32' }}>
                  {formatVnd(data.totalRevenue)}
                </div>
                <div className="admin-stat-card__label">Tổng doanh thu thực tế</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#e3f2fd', color: '#1565c0' }}>
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="admin-stat-card__value">{data.totalOrders} đơn</div>
                <div className="admin-stat-card__label">Tổng lượt đặt hàng</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#f5e0cf', color: '#9d592b' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="admin-stat-card__value">{formatVnd(data.averageOrderValue)}</div>
                <div className="admin-stat-card__label">Giá trị trung bình / đơn</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon" style={{ background: '#fff3e0', color: '#e65100' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="admin-stat-card__value">{successRate}%</div>
                <div className="admin-stat-card__label">Tỷ lệ hoàn thành đơn</div>
              </div>
            </div>
          </section>

          {/* Two-column Analytics Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Best Sellers */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} style={{ color: '#f59e0b' }} />
                  <span>Top Món Bán Chạy Nhất</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Theo số lượng bán</span>
              </div>

              {data.topProducts.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '1rem 0' }}>Chưa có dữ liệu món bán ra.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {data.topProducts.map((p, idx) => {
                    const maxQty = Math.max(...data.topProducts.map((x) => x.quantity), 1);
                    const percent = Math.round((p.quantity / maxQty) * 100);

                    return (
                      <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                          <span style={{ fontWeight: 600 }}>
                            <span style={{ display: 'inline-block', width: '22px', color: idx === 0 ? '#f59e0b' : 'var(--muted)' }}>
                              #{idx + 1}
                            </span>
                            {p.name}
                          </span>
                          <span>
                            <strong>{p.quantity} ly</strong> • {formatVnd(p.revenue)}
                          </span>
                        </div>
                        <div style={{ height: '6px', width: '100%', background: '#f5ece5', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background: idx === 0 ? '#9d592b' : '#c99a75',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pipeline Status Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart3 size={18} style={{ color: '#3b82f6' }} />
                  <span>Phân Bổ Vòng Đời Đơn Hàng</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Toàn hệ thống</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#e8f5e9', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>🟢 Đã hoàn tất (`COMPLETED`)</span>
                  <strong>{data.statusCounts?.COMPLETED || 0} đơn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#e3f2fd', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>🔵 Cần làm món (`PAID`)</span>
                  <strong>{data.statusCounts?.PAID || 0} đơn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#fff3e0', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>🟠 Đang pha chế (`PREPARING`)</span>
                  <strong>{data.statusCounts?.PREPARING || 0} đơn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#f3e5f5', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>🟣 Chờ thanh toán (`PENDING`)</span>
                  <strong>{data.statusCounts?.PENDING || 0} đơn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#ffebee', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>🔴 Đã hủy / Hoàn tiền (`CANCELLED`)</span>
                  <strong>{data.statusCounts?.CANCELLED || 0} đơn</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
