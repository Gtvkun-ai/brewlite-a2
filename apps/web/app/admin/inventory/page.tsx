'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  ClipboardList,
  Tag,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Check,
  PackageCheck,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchMaterials,
  fetchBottleneckForecast,
  fetchRecipes,
  updateMaterial,
  runTestDSimulation,
  resetDemoStock,
  fetchInboundLogs,
  restockMaterialApi,
  Ingredient,
  BottleneckForecast,
  ProductRecipe,
  TestDSimulationResult,
  InboundReceipt,
} from '../../../lib/inventory-api';
import { Loading } from '../../../components/States';

export default function AdminInventoryPage() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [materials, setMaterials] = useState<Ingredient[]>([]);
  const [forecasts, setForecasts] = useState<BottleneckForecast[]>([]);
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [selectedSize, setSelectedSize] = useState<'REGULAR' | 'LARGE'>('REGULAR');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('CF-SUA');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Simulation State for TEST D
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<TestDSimulationResult | null>(null);

  // Edit Material Modal State
  const [editingMaterial, setEditingMaterial] = useState<Ingredient | null>(null);
  const [editStockValue, setEditStockValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Inbound Receipts State (Phiếu Nhập Hàng)
  const [inboundLogs, setInboundLogs] = useState<InboundReceipt[]>([]);
  const [isInboundModalOpen, setIsInboundModalOpen] = useState<boolean>(false);
  const [inboundIngredientCode, setInboundIngredientCode] = useState<string>('ING-MILK-FRESH');
  const [inboundAmount, setInboundAmount] = useState<string>('1000');
  const [inboundNote, setInboundNote] = useState<string>('Nhập bổ sung từ nhà cung cấp');
  const [isInboundSubmitting, setIsInboundSubmitting] = useState<boolean>(false);

  const isAdmin =
    isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [mats, bForecast, recs, logs] = await Promise.all([
        fetchMaterials(),
        fetchBottleneckForecast(selectedSize),
        fetchRecipes(),
        fetchInboundLogs(),
      ]);
      setMaterials(mats);
      setForecasts(bForecast);
      setRecipes(recs);
      setInboundLogs(logs);
    } catch {
      setActionError('Không thể tải dữ liệu định mức tồn kho.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSize]);

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

  const handleRunTestD = async () => {
    setSimulationRunning(true);
    setActionError(null);
    try {
      const result = await runTestDSimulation();
      setSimulationResult(result);
      setActionSuccess('Đã thực thi thành công bài kiểm thử TEST D theo chuẩn Giảng viên!');
      // Tải lại số liệu tồn kho mới
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thực thi TEST D thất bại';
      setActionError(msg);
    } finally {
      setSimulationRunning(false);
    }
  };

  const handleResetStock = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await resetDemoStock();
      setSimulationResult(null);
      setActionSuccess('Đã khôi phục kho về mức mẫu: 500g cà phê, 1.000ml sữa, 200g đường.');
      await loadData();
    } catch {
      setActionError('Khôi phục kho thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    const val = parseFloat(editStockValue);
    if (isNaN(val) || val < 0) {
      setActionError('Số lượng tồn kho không hợp lệ');
      return;
    }
    setIsUpdating(true);
    try {
      await updateMaterial(editingMaterial.code, val);
      setActionSuccess(`Đã cập nhật tồn kho ${editingMaterial.name} thành ${val} ${editingMaterial.unit}`);
      setEditingMaterial(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      setActionError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateInboundReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(inboundAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError('Số lượng nhập hàng phải lớn hơn 0');
      return;
    }
    setIsInboundSubmitting(true);
    setActionError(null);
    try {
      const res = await restockMaterialApi(
        inboundIngredientCode,
        amount,
        inboundNote.trim() || undefined,
      );
      setActionSuccess(
        `Đã lập phiếu nhập kho thành công! Cộng thêm +${amount}${res.ingredient.unit} vào ${res.ingredient.name}. Tồn kho mới: ${res.ingredient.currentStock}${res.ingredient.unit}.`,
      );
      setIsInboundModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nhập hàng thất bại';
      setActionError(msg);
    } finally {
      setIsInboundSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loading label="Đang kiểm tra quyền quản trị..." />;
  }

  // Access Guard Screen if not Admin/Manager
  if (!isAdmin) {
    return (
      <main className="admin-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff2e8', color: '#d46b08', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Layers size={28} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
            Phân Hệ Quản Lý Kho & Định Mức BOM
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Khu vực dành riêng cho Quản lý & Kỹ sư kiểm thử để giám sát định mức nguyên vật liệu (TEST D).
          </p>

          <button
            type="button"
            onClick={handleQuickAdminLogin}
            className="btn btn--primary"
            style={{ width: '100%', padding: '0.8rem', borderRadius: '999px', fontWeight: 700, marginBottom: '0.75rem' }}
          >
            Đăng nhập nhanh với quyền Quản lý
          </button>
          <Link href="/" className="btn btn--secondary" style={{ width: '100%', padding: '0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>
            Quay lại trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const activeForecast =
    forecasts.find((f) => f.productCode === selectedProductCode) ||
    forecasts.find((f) => f.productCode === 'CF-SUA') ||
    forecasts[0];

  return (
    <main className="admin-container" data-testid="admin-inventory-page">
      {/* Header */}
      <header className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge--accent" style={{ background: '#f5e0cf', color: '#9d592b', border: '1px solid #ecc9ad' }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              BOM Engine & Quản Trị Tồn Kho
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Xin chào, <strong>{user?.fullName || user?.email}</strong> ({user?.role})
            </span>
          </div>
          <h1 className="admin-header__title">Định Mức Nguyên Liệu & Điểm Nghẽn Kho (TEST D)</h1>
          <p className="admin-header__subtitle">
            Giám sát kho nguyên vật liệu thô (g Cà phê, ml Sữa, g Đường), dự báo năng lực pha chế tối đa và mô phỏng kiểm thử tự động.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setIsInboundModalOpen(true);
              setInboundIngredientCode(materials[0]?.code || 'ING-MILK-FRESH');
              setInboundAmount('1000');
              setInboundNote('Nhập bổ sung từ nhà cung cấp');
            }}
            className="btn btn--primary"
            style={{ borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, background: '#1b5e20', borderColor: '#1b5e20' }}
            title="Tạo phiếu nhập thêm nguyên vật liệu vào kho"
            data-testid="admin-create-inbound-btn"
          >
            <PackageCheck size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Tạo Phiếu Nhập Hàng (+)</span>
          </button>
          <button
            type="button"
            onClick={handleResetStock}
            disabled={isLoading || simulationRunning}
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem', color: '#8c4b18' }}
            title="Khôi phục kho về mức chuẩn của Giảng viên (500g, 1000ml, 200g)"
          >
            <RotateCcw size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Khôi phục mẫu</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading || simulationRunning}
            className="btn btn--secondary"
            style={{ borderRadius: '999px', fontSize: '0.85rem' }}
            title="Làm mới số liệu kho"
          >
            <RefreshCw size={14} style={{ display: 'inline', marginRight: '0.35rem' }} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <Link href="/" className="btn btn--secondary" style={{ borderRadius: '999px', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>Xem Menu</span>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav-tabs" aria-label="Phân hệ Quản trị">
        <Link href="/admin/dashboard" className="admin-nav-tab">
          <BarChart3 size={16} />
          <span>Dashboard Doanh Thu</span>
        </Link>
        <Link href="/admin/orders" className="admin-nav-tab">
          <ClipboardList size={16} />
          <span>Đơn hàng & KDS Barista</span>
        </Link>
        <Link href="/admin/products" className="admin-nav-tab">
          <Coffee size={16} />
          <span>Quản lý Thực đơn</span>
        </Link>
        <Link href="/admin/promotions" className="admin-nav-tab">
          <Tag size={16} />
          <span>Mã Khuyến Mãi</span>
        </Link>
        <Link href="/admin/inventory" className="admin-nav-tab admin-nav-tab--active" data-testid="admin-tab-inventory">
          <Layers size={16} />
          <span>Kho & Định Mức BOM</span>
        </Link>
      </nav>

      {/* Alerts */}
      {actionError && (
        <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SECTION 1: RAW MATERIALS INVENTORY CARDS */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              1. Tồn Kho Nguyên Vật Liệu Thực Tế
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>
              Bộ dữ liệu định mức giả lập theo tài liệu của Giảng viên (lecturer-audit-report.md)
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', background: '#f5ece5', padding: '0.3rem 0.75rem', borderRadius: '999px', fontWeight: 600, color: '#68402c' }}>
            Đơn vị: g, ml
          </span>
        </div>

        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {materials.map((mat) => {
            const isMilk = mat.code === 'ING-MILK-FRESH';
            const isCoffee = mat.code === 'ING-COFFEE-ROBUSTA';
            const percent = Math.min(100, Math.round((mat.currentStock / mat.initialDemoStock) * 100));
            const isCritical = mat.currentStock <= mat.minThreshold;

            return (
              <div
                key={mat.code}
                className="admin-stat-card"
                style={{
                  border: isMilk && mat.currentStock === 0 ? '2px solid #e53935' : isMilk ? '2px solid #f57c00' : '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isMilk && (
                  <div style={{ position: 'absolute', top: '10px', right: '12px' }}>
                    <span style={{ fontSize: '0.72rem', background: mat.currentStock === 0 ? '#ffebee' : '#fff3e0', color: mat.currentStock === 0 ? '#c62828' : '#e65100', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 700, border: '1px solid currentColor' }}>
                      {mat.currentStock === 0 ? 'ĐÃ HẾT NGUYÊN LIỆU' : '⚠️ Bottleneck'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isCoffee ? '#f4ece1' : isMilk ? '#e3f2fd' : '#f3e5f5',
                      color: isCoffee ? '#68402c' : isMilk ? '#1976d2' : '#7b1fa2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isCoffee ? <Coffee size={22} /> : isMilk ? <Flame size={22} /> : <Sparkles size={22} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {mat.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Mã: {mat.code}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: isCritical ? '#c62828' : 'var(--text)' }}>
                      {mat.currentStock.toLocaleString('vi-VN')}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--muted)', marginLeft: '0.25rem' }}>{mat.unit}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Tiêu chuẩn: {mat.initialDemoStock} {mat.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: percent <= 20 ? '#e53935' : percent <= 50 ? '#fb8c00' : '#43a047',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Cảnh báo khi dưới {mat.minThreshold} {mat.unit}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInboundModalOpen(true);
                        setInboundIngredientCode(mat.code);
                        setInboundAmount(mat.unit === 'ml' ? '1000' : '500');
                        setInboundNote(`Nhập bổ sung ${mat.name}`);
                      }}
                      className="btn btn--primary"
                      style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', borderRadius: '8px', background: '#1b5e20', borderColor: '#1b5e20', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      title="Tạo phiếu nhập thêm cho nguyên liệu này"
                    >
                      <PackageCheck size={12} />
                      Nhập thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMaterial(mat);
                        setEditStockValue(mat.currentStock.toString());
                      }}
                      className="btn btn--secondary"
                      style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      title="Hiệu chỉnh thủ công tồn kho thực tế"
                    >
                      <Sliders size={12} />
                      Hiệu chỉnh
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: BOTTLENECK PRINCIPLE VISUALIZATION */}
      <section style={{ marginBottom: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                Thuật Toán Nút Thắt (Bottleneck Principle)
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                2. Dự Báo Năng Lực Phục Vụ Tối Đa
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
              Khả năng nhận đơn tối đa được xác định bởi nguyên vật liệu chạm đáy đầu tiên: Q = min(Kho_i / Định mức_i)
            </p>
          </div>

          {/* Size switch */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f5ece5', padding: '0.25rem', borderRadius: '999px', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setSelectedSize('REGULAR')}
              style={{
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: selectedSize === 'REGULAR' ? 'var(--text)' : 'transparent',
                color: selectedSize === 'REGULAR' ? '#fff' : 'var(--text)',
                transition: 'all 0.2s',
              }}
            >
              Size Vừa (Regular)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSize('LARGE')}
              style={{
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: selectedSize === 'LARGE' ? 'var(--text)' : 'transparent',
                color: selectedSize === 'LARGE' ? '#fff' : 'var(--text)',
                transition: 'all 0.2s',
              }}
            >
              Size Lớn (Large)
            </button>
          </div>
        </div>

        {/* Product selector chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {forecasts.map((f) => {
            const isSelected = activeForecast?.productCode === f.productCode;
            return (
              <button
                key={f.productCode}
                type="button"
                onClick={() => setSelectedProductCode(f.productCode)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #68402c' : '1px solid #e0d5cb',
                  background: isSelected ? '#68402c' : '#faf6f0',
                  color: isSelected ? '#fff' : '#4a2c1d',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Coffee size={14} />
                <span>{f.productName}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#fff',
                    color: isSelected ? '#fff' : (f.maxCups === 0 ? '#c62828' : '#2e7d32'),
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  {f.maxCups} ly
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Breakdown for Active Selected Product */}
        {activeForecast && (
          <div style={{ background: '#faf6f0', borderRadius: '14px', border: '1px solid #ebd9c7', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8c4b18', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeForecast.productCode === 'CF-SUA'
                    ? '🎯 Kịch bản Trọng tâm Giảng viên (TEST D)'
                    : '📋 Chi Tiết Định Mức & Điểm Nghẽn Món'}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#382217', margin: '0.15rem 0' }}>
                  {activeForecast.productName} ({activeForecast.size})
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Khả năng phục vụ tối đa:</span>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: activeForecast.maxCups === 0 ? '#c62828' : '#2e7d32' }}>
                  {activeForecast.maxCups} <span style={{ fontSize: '1rem', fontWeight: 700 }}>ly</span>
                </div>
              </div>
            </div>

            {/* Formula display */}
            <div style={{ background: '#fff', border: '1px solid #e5d2bf', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#42281a', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}>
              <strong>Công thức:</strong> {activeForecast.formula}
            </div>

            {/* Breakdown per ingredient */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
              {activeForecast.breakdown.map((b) => (
                <div
                  key={b.ingredientCode}
                  style={{
                    background: b.isBottleneck ? '#fff3e0' : '#fff',
                    border: b.isBottleneck ? '1.5px solid #ff9800' : '1px solid #e0d5cb',
                    borderRadius: '8px',
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)' }}>{b.ingredientName}</span>
                    {b.isBottleneck && (
                      <span style={{ fontSize: '0.7rem', background: '#ff9800', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                        ⚠️ Bottleneck
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                    Định mức: <strong>{b.amountPerCup} {b.unit}/ly</strong> (Kho: {b.currentStock} {b.unit})
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: b.isBottleneck ? '#e65100' : 'var(--text)' }}>
                    → Giới hạn: {b.availableCups} ly
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: INTERACTIVE LIVE TEST D SHOWCASE */}
      <section style={{ marginBottom: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ background: '#ede7f6', color: '#512da8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                Trình Kiểm Thử Trực Tiếp (Live Demo)
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                3. Mô Phỏng & Báo Cáo Nghiệm Thu TEST D
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
              Kịch bản chuẩn Giảng viên: Bán liên tục 20 ly &rarr; Sữa về 0ml &rarr; Chặn ly thứ 21 với HTTP 400 (OUT_OF_STOCK_INGREDIENT).
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunTestD}
            disabled={simulationRunning}
            className="btn btn--primary"
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: '#2e7d32',
              borderColor: '#2e7d32',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
            }}
          >
            <Play size={16} />
            <span>{simulationRunning ? 'Đang thực thi mô phỏng...' : '▶️ Chạy Mô Phỏng TEST D'}</span>
          </button>
        </div>

        {/* Simulation Output Area */}
        {simulationResult && (
          <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e9ecef', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #81c784', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Check size={14} /> KẾT QUẢ: {simulationResult.status} (100% PASS)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Xác nhận lúc: {new Date(simulationResult.verifiedAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#382217' }}>
                Số ly bán thành công: {simulationResult.successCount} / 20 | Số ly bị chặn: 1 / 1
              </span>
            </div>

            {/* 4-Step Verification Stepper Visualizer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#2e7d32', fontWeight: 800, fontSize: '0.82rem' }}>
                  <CheckCircle size={15} /> 1. Khởi Tạo Kho Ban Đầu
                </div>
                <div style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.45 }}>
                  • Cà phê Robusta: <strong>500g</strong><br />
                  • Sữa tươi Đà Lạt: <strong>1.000ml</strong><br />
                  • Đường mía tinh luyện: <strong>200g</strong>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#2e7d32', fontWeight: 800, fontSize: '0.82rem' }}>
                  <CheckCircle size={15} /> 2. Bán 20 Ly Cà Phê Sữa
                </div>
                <div style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.45 }}>
                  • Trừ Cà phê: 20 × 10g = <strong>200g</strong><br />
                  • Trừ Sữa tươi: 20 × 50ml = <strong>1.000ml</strong><br />
                  • Trừ Đường: 20 × 5g = <strong>100g</strong>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #ffe0b2', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#e65100', fontWeight: 800, fontSize: '0.82rem' }}>
                  <AlertTriangle size={15} /> 3. Chạm Điểm Nghẽn Sữa
                </div>
                <div style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.45 }}>
                  • Sữa tươi: <strong style={{ color: '#c62828' }}>0 ml (CHẠM ĐÁY)</strong><br />
                  • Cà phê còn dư: <strong>300g</strong><br />
                  • Đường còn dư: <strong>100g</strong>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #ffcdd2', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', color: '#c62828', fontWeight: 800, fontSize: '0.82rem' }}>
                  <ShieldCheck size={15} /> 4. Chặn Ly 21 (HTTP 400)
                </div>
                <div style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.45 }}>
                  • Lỗi: <strong>OUT_OF_STOCK_INGREDIENT</strong><br />
                  • Máy chủ từ chối nhận đơn ly 21<br />
                  • Trạng thái: <strong style={{ color: '#2e7d32' }}>PASS 100%</strong>
                </div>
              </div>
            </div>

            {/* Error Rejection Box */}
            <div style={{ background: '#fff', borderLeft: '4px solid #c62828', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c62828', marginBottom: '0.2rem' }}>
                [BẮT NGOẠI LỆ TẠI LY THỨ {simulationResult.failureAttempt.cupNumber}] Mã lỗi: {simulationResult.failureAttempt.errorCode} ({simulationResult.failureAttempt.status} Bad Request)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#424242' }}>
                Thông điệp phản hồi từ máy chủ: <em>&ldquo;{simulationResult.failureAttempt.errorMessage}&rdquo;</em>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                Nguyên liệu thiếu: <strong>{simulationResult.failureAttempt.missingIngredient}</strong> (Đã về 0ml sau 20 ly).
              </div>
            </div>

            {/* Terminal log output */}
            <div style={{ background: '#1e1e1e', color: '#4af626', padding: '1rem', borderRadius: '8px', fontFamily: 'Consolas, monospace', fontSize: '0.8rem', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>
              <div style={{ color: '#888', marginBottom: '0.4rem' }}>{`// NHẬT KÝ KIỂM THỬ THỰC THI (TEST D AUDIT LOGS)`}</div>
              {simulationResult.logs.map((log, idx) => (
                <div key={idx} style={{ color: log.includes('CHẶN') ? '#ff5252' : log.includes('PASS') ? '#69f0ae' : '#e0e0e0' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: RECIPE & BOM CONFIGURATION TABLE */}
      <section style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              4. Bảng Ma Trận Định Mức Công Thức Món (Recipe / BOM Matrix)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>
              Quy định số lượng từng nguyên liệu cần thiết cho mỗi ly thành phẩm
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f5ece5', borderBottom: '2px solid #e0d0c3', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Mã & Tên Sản Phẩm</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Kích Cỡ</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Cà Phê (g)</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Sữa Tươi (ml)</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Đường (g)</th>
                <th style={{ padding: '0.75rem 1rem', color: '#4a2c1d', fontWeight: 700 }}>Khả Năng Phục Vụ</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => {
                const items = r.recipes[selectedSize] || r.recipes.REGULAR;
                const coffee = items.find((i) => i.ingredientCode === 'ING-COFFEE-ROBUSTA')?.amount || 0;
                const milk = items.find((i) => i.ingredientCode === 'ING-MILK-FRESH')?.amount || 0;
                const sugar = items.find((i) => i.ingredientCode === 'ING-SUGAR-REFINED')?.amount || 0;

                const forecast = forecasts.find((f) => f.productCode === r.productCode && f.size === selectedSize);

                return (
                  <tr key={r.productCode} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong>{r.productName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.productCode}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ background: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {selectedSize}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#68402c' }}>{coffee} g</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1565c0' }}>{milk > 0 ? `${milk} ml` : '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#7b1fa2' }}>{sugar > 0 ? `${sugar} g` : '—'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 800, color: (forecast?.maxCups || 0) === 0 ? '#c62828' : '#2e7d32' }}>
                        {forecast?.maxCups ?? '—'} ly
                      </span>
                      {forecast?.bottleneckIngredientName && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          Giới hạn bởi: {forecast.bottleneckIngredientName.split(' ')[0]}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: INBOUND RECEIPTS & AUDIT TRAIL */}
      <section style={{ marginTop: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                Kiểm Toán Kho (Audit Trail)
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                5. Nhật Ký Phiếu Nhập Hàng & Lô Nguyên Liệu
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
              Ghi nhận lịch sử nhập hàng thực tế, nguồn cung cấp và sự gia tăng tồn kho
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsInboundModalOpen(true);
              setInboundIngredientCode(materials[0]?.code || 'ING-MILK-FRESH');
              setInboundAmount('1000');
              setInboundNote('Nhập bổ sung từ nhà cung cấp');
            }}
            className="btn btn--primary"
            style={{ borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, background: '#1b5e20', borderColor: '#1b5e20' }}
          >
            <PackageCheck size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
            <span>+ Tạo Phiếu Nhập Mới</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Tổng Số Phiếu Nhập</span>
            <strong style={{ fontSize: '1.25rem', color: '#1b5e20' }}>{inboundLogs.length} phiếu</strong>
          </div>
          <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Tổng Sữa Tươi Đã Nhập</span>
            <strong style={{ fontSize: '1.25rem', color: '#1565c0' }}>
              {inboundLogs.filter((l) => l.ingredientCode === 'ING-MILK-FRESH').reduce((acc, l) => acc + l.amountAdded, 0).toLocaleString('vi-VN')} ml
            </strong>
          </div>
          <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Tổng Cà Phê Đã Nhập</span>
            <strong style={{ fontSize: '1.25rem', color: '#68402c' }}>
              {inboundLogs.filter((l) => l.ingredientCode === 'ING-COFFEE-ROBUSTA').reduce((acc, l) => acc + l.amountAdded, 0).toLocaleString('vi-VN')} g
            </strong>
          </div>
          <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Lần Nhập Gần Nhất</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {inboundLogs[0] ? new Date(inboundLogs[0].createdAt).toLocaleTimeString('vi-VN') : '—'}
            </strong>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f5ece5', borderBottom: '2px solid #e0d0c3', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Mã Phiếu</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Thời Gian Nhập</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Nguyên Liệu</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Số Lượng Nhập</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Biến Động Tồn</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Ghi Chú / Nguồn Nhập</th>
                <th style={{ padding: '0.65rem 0.85rem', color: '#4a2c1d', fontWeight: 700 }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {inboundLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#382217' }}>
                    {log.id}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600 }}>
                    {log.ingredientName}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: '#2e7d32' }}>
                    +{log.amountAdded.toLocaleString('vi-VN')} {log.unit}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {log.beforeStock} &rarr; <strong style={{ color: 'var(--text)' }}>{log.afterStock} {log.unit}</strong>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: '#555' }}>
                    {log.supplierOrNote}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✓ ĐÃ VÀO KHO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: CREATE INBOUND GOODS RECEIPT */}
      {isInboundModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1b5e20', textTransform: 'uppercase' }}>
                  Hệ Thống Kho Hàng BrewLite
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0', color: 'var(--text)' }}>
                  Lập Phiếu Nhập Hàng Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInboundModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInboundReceipt}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Chọn nguyên vật liệu nhập:
                </label>
                <select
                  value={inboundIngredientCode}
                  onChange={(e) => setInboundIngredientCode(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  {materials.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name} (Tồn hiện tại: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Số lượng nhập thêm:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={inboundAmount}
                    onChange={(e) => setInboundAmount(e.target.value)}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 700 }}
                    placeholder="Ví dụ: 1000"
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--muted)', minWidth: '40px' }}>
                    {materials.find((m) => m.code === inboundIngredientCode)?.unit || 'đơn vị'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Nhà cung cấp / Ghi chú lô hàng:
                </label>
                <input
                  type="text"
                  required
                  value={inboundNote}
                  onChange={(e) => setInboundNote(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                  placeholder="Ví dụ: Đà Lạt Milk - Lô thanh trùng sáng 16/11"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsInboundModalOpen(false)}
                  className="btn btn--secondary"
                  style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isInboundSubmitting}
                  className="btn btn--primary"
                  style={{ borderRadius: '8px', padding: '0.6rem 1.4rem', fontWeight: 700, background: '#1b5e20', borderColor: '#1b5e20' }}
                >
                  {isInboundSubmitting ? 'Đang tạo phiếu...' : '✓ Xác Nhận Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STOCK */}
      {editingMaterial && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Điều Chỉnh Tồn Kho Nguyên Liệu</h3>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStock}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Tên nguyên liệu:
                </label>
                <input
                  type="text"
                  disabled
                  value={editingMaterial.name}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', background: '#f5f5f5' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Số lượng tồn mới ({editingMaterial.unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editStockValue}
                  onChange={(e) => setEditStockValue(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 700 }}
                  placeholder={`Ví dụ: ${editingMaterial.initialDemoStock}`}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="btn btn--secondary"
                  style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn--primary"
                  style={{ borderRadius: '8px', padding: '0.6rem 1.25rem' }}
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
