'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Lock,
  ClipboardList,
  ChefHat,
  Bell,
  Check,
  X,
  User,
  Phone,
  MessageSquare,
  BarChart3,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchAllOrders,
  updateOrderStatusApi,
  cancelOrderApi,
} from '../../../lib/orders-api';
import { formatVnd } from '../../../lib/format';
import type { OrderResponse, OrderStatus } from '../../../lib/types';
import { Loading } from '../../../components/States';

const STATUS_FILTER_OPTIONS: { label: string; value: OrderStatus | 'ALL'; color: string }[] = [
  { label: 'Tất cả đơn', value: 'ALL', color: 'var(--text)' },
  { label: 'Cần làm (Đã trả tiền)', value: 'PAID', color: '#1976d2' },
  { label: 'Đang pha chế', value: 'PREPARING', color: '#f57c00' },
  { label: 'Chờ lấy món', value: 'READY', color: '#388e3c' },
  { label: 'Chờ thanh toán', value: 'PENDING', color: '#7b1fa2' },
  { label: 'Hoàn tất', value: 'COMPLETED', color: '#616161' },
  { label: 'Đã hủy', value: 'CANCELLED', color: '#d32f2f' },
];

export default function AdminOrdersPage() {
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const isDevMode = process.env.NODE_ENV !== 'production';

  const isStaff =
    isAuthenticated &&
    (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'BARISTA');

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await fetchAllOrders(undefined, token ?? undefined);
      setOrders(data);
    } catch {
      setActionError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isStaff) {
      void loadOrders();
    }
  }, [isStaff, loadOrders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setActionError(null);
    try {
      const updated = await updateOrderStatusApi(orderId, nextStatus, token ?? undefined);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: updated.status } : ord)),
      );
      setActionSuccess(`Đã chuyển đơn #${updated.code} sang trạng thái "${getStatusLabel(nextStatus)}".`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái đơn';
      setActionError(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (order: OrderResponse) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.code}? Kho và tiền sẽ được hoàn trả.`)) {
      return;
    }
    setUpdatingOrderId(order.id);
    setActionError(null);
    try {
      const updated = await cancelOrderApi(order.id, token ?? undefined);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === order.id ? { ...ord, status: updated.status } : ord)),
      );
      setActionSuccess(`Đã hủy đơn #${order.code} và kích hoạt quy trình hoàn kho/hoàn tiền.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hủy đơn hàng';
      setActionError(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Đã thanh toán (Cần pha)
          </span>
        );
      case 'PREPARING':
        return (
          <span className="badge" style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' }}>
            <ChefHat size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Đang pha chế
          </span>
        );
      case 'READY':
        return (
          <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
            <Bell size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Sẵn sàng lấy món
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge" style={{ background: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0' }}>
            <CheckCircle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Đã hoàn tất
          </span>
        );
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return (
          <span className="badge" style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' }}>
            <XCircle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {status === 'CANCELLED' ? 'Đã hủy đơn' : 'Thanh toán lỗi'}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="badge" style={{ background: '#f3e5f5', color: '#7b1fa2', border: '1px solid #e1bee7' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Chờ thanh toán
          </span>
        );
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PREPARING':
        return 'Đang pha chế';
      case 'READY':
        return 'Sẵn sàng nhận món';
      case 'COMPLETED':
        return 'Hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PENDING':
        return 'Chờ thanh toán';
      default:
        return status;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        o.code.toLowerCase().includes(query) ||
        (o.customerName && o.customerName.toLowerCase().includes(query)) ||
        (o.deliveryNote && o.deliveryNote.toLowerCase().includes(query)) ||
        o.items.some((it) => it.productName.toLowerCase().includes(query));

      return matchStatus && matchQuery;
    });
  }, [orders, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'PAID').length;
    const preparing = orders.filter((o) => o.status === 'PREPARING').length;
    const ready = orders.filter((o) => o.status === 'READY').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    return { paid, preparing, ready, completed, total: orders.length };
  }, [orders]);

  // Demo auto-login for testing convenience (Dev environment only)
  const handleQuickStaffLogin = async (role: 'ADMIN' | 'BARISTA') => {
    try {
      setIsLoading(true);
      await login({
        email: role === 'ADMIN' ? 'admin@brewlite.vn' : 'barista@brewlite.vn',
        password: 'Password123!',
      });
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setActionError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <Loading label="Đang kiểm tra quyền truy cập KDS..." />;
  }

  // Access Guard Screen if not Staff (BARISTA, MANAGER, ADMIN)
  if (!isStaff) {
    return (
      <main className="admin-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem 1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff3e0', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ChefHat size={28} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
            Màn Hình Pha Chế Barista & KDS
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Trang này chỉ dành cho nhân viên pha chế (<strong>BARISTA</strong>), Quản lý (MANAGER) hoặc Quản trị viên (ADMIN).
          </p>

          {isDevMode ? (
            <>
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem', textAlign: 'left', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#b78103', marginBottom: '0.35rem' }}>
                  <Lock size={14} />
                  <span>🔑 Tài khoản Staff dùng thử (Dev Mode Only):</span>
                </div>
                <div>• Barista: <strong>barista@brewlite.vn</strong> (Password123!)</div>
                <div>• Admin: <strong>admin@brewlite.vn</strong> (Password123!)</div>
                <div style={{ fontSize: '0.74rem', color: '#8d6e63', marginTop: '0.45rem', borderTop: '1px dashed #ffe082', paddingTop: '0.35rem', lineHeight: 1.4 }}>
                  ⚠️ Lưu ý bảo mật: Khung này tự động bị vô hiệu hóa trên môi trường Production.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin('BARISTA')}
                  className="btn btn--primary"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700 }}
                >
                  <Sparkles size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  <span>Đăng nhập 1-chạm (Barista)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStaffLogin('ADMIN')}
                  className="btn btn--secondary"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '999px' }}
                >
                  Đăng nhập 1-chạm (Admin Quản Trị)
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
                Vui lòng đăng nhập bằng tài khoản Barista hoặc Quản trị viên được cấp phép để tiếp tục.
              </p>
              <Link
                href="/login"
                className="btn btn--primary"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700 }}
              >
                Chuyển đến trang Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="admin-container" data-testid="admin-orders-page">
      {/* Header */}
      <header className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--accent" style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
              <ChefHat size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Điều Phối & Bếp Pha Chế (KDS)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong> ({user?.role})
            </span>
          </div>
          <h1 className="admin-header__title">Quản Trị Đơn Hàng & KDS Barista</h1>
          <p className="admin-header__subtitle">
            Tiếp nhận đơn hàng tự động, cập nhật tiến độ pha chế thời gian thực và quản lý đơn ngoại lệ.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem' }}
            title="Tải lại danh sách đơn hàng"
            data-testid="admin-refresh-orders-btn"
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
          className="admin-nav-tab"
          data-testid="admin-tab-dashboard"
        >
          <BarChart3 size={16} />
          <span>Dashboard Doanh Thu</span>
        </Link>
        <Link
          href="/admin/orders"
          className="admin-nav-tab admin-nav-tab--active"
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

      {/* Stats Summary Cards */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#e3f2fd', color: '#1565c0' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.paid}</div>
            <div className="admin-stat-card__label">Cần làm (Đã trả tiền)</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#fff3e0', color: '#e65100' }}>
            <ChefHat size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.preparing}</div>
            <div className="admin-stat-card__label">Đang pha chế</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
            <Bell size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.ready}</div>
            <div className="admin-stat-card__label">Chờ khách nhận</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon" style={{ background: '#f5f5f5', color: '#616161' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.completed}</div>
            <div className="admin-stat-card__label">Đã hoàn tất</div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="kds-status-tabs">
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const count =
              opt.value === 'ALL'
                ? orders.length
                : orders.filter((o) => o.status === opt.value).length;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedStatus(opt.value)}
                className={`kds-status-tab ${selectedStatus === opt.value ? 'kds-status-tab--active' : ''}`}
                data-testid={`kds-filter-${opt.value.toLowerCase()}`}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: selectedStatus === opt.value ? 'rgba(255,255,255,0.25)' : '#eee',
                    color: selectedStatus === opt.value ? '#ffffff' : 'var(--text)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <Search size={16} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Tìm theo mã đơn, khách, món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Grid / KDS Cards */}
      {isLoading ? (
        <Loading label="Đang tải danh sách đơn hàng..." />
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <ClipboardList size={40} style={{ color: 'var(--muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem' }}>Không có đơn hàng nào</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Chưa có đơn hàng nào phù hợp với bộ lọc &quot;{STATUS_FILTER_OPTIONS.find((s) => s.value === selectedStatus)?.label}&quot;.
          </p>
        </div>
      ) : (
        <div className="kds-grid" data-testid="kds-orders-grid">
          {filteredOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const cardClass =
              order.status === 'PREPARING'
                ? 'kds-card kds-card--preparing'
                : order.status === 'READY'
                  ? 'kds-card kds-card--ready'
                  : order.status === 'PAID'
                    ? 'kds-card kds-card--paid'
                    : 'kds-card';

            const formattedTime = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={order.id} className={cardClass} data-testid={`kds-card-${order.id}`}>
                {/* Header */}
                <div>
                  <div className="kds-card__header">
                    <div>
                      <div className="kds-card__code">#{order.code}</div>
                      <div className="kds-card__time">
                        <Clock size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                        {formattedTime}
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Customer info & Delivery Note */}
                  <div className="kds-card__customer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text)' }}>
                      <User size={12} />
                      <span>{order.customerName || 'Khách đặt qua Web'}</span>
                      {order.customerPhone && (
                        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.78rem' }}>
                          ({order.customerPhone})
                        </span>
                      )}
                    </div>
                    {order.deliveryNote && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.35rem', background: '#fff9c4', padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#5d4037', border: '1px solid #fff176' }}>
                        <MessageSquare size={12} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                        <span><strong>Ghi chú:</strong> {order.deliveryNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <ul className="kds-card__items">
                    {order.items.map((item) => (
                      <li key={item.id} className="kds-card__item">
                        <div>
                          <div className="kds-card__item-name">
                            <span style={{ color: 'var(--accent)', marginRight: '0.35rem' }}>
                              {item.quantity}x
                            </span>
                            {item.productName}
                          </div>
                          <div className="kds-card__item-options">
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                            {item.selectedToppings && item.selectedToppings.length > 0 && (
                              <span> • {item.selectedToppings.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          {formatVnd(item.itemTotal)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer & Action Bar */}
                <div className="kds-card__footer">
                  <div className="kds-card__total">
                    <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Tổng cộng:</span>
                    <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                      {formatVnd(order.totalAmount)}
                    </strong>
                  </div>

                  {/* Quick Action Button based on Status */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.status === 'PAID' && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          className="btn btn--primary"
                          style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                          data-testid={`kds-btn-start-${order.id}`}
                        >
                          <ChefHat size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                          <span>Bắt đầu pha chế</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleCancelOrder(order)}
                          className="btn btn--secondary"
                          style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#c62828' }}
                          title="Hủy đơn hàng"
                          data-testid={`kds-btn-cancel-${order.id}`}
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="btn btn--primary"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, background: '#2e7d32', borderColor: '#2e7d32' }}
                        data-testid={`kds-btn-ready-${order.id}`}
                      >
                        <Bell size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        <span>Mời khách nhận món</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="btn btn--secondary"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                        data-testid={`kds-btn-complete-${order.id}`}
                      >
                        <Check size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        <span>Hoàn tất đơn</span>
                      </button>
                    )}

                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleCancelOrder(order)}
                        className="btn btn--secondary"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', fontSize: '0.82rem', color: '#c62828' }}
                        data-testid={`kds-btn-cancel-${order.id}`}
                      >
                        <X size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        <span>Hủy đơn</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
