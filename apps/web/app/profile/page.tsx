'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Mail,
  Shield,
  KeyRound,
  ShoppingBag,
  Sparkles,
  LogOut,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Form Thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim()) {
      setProfileError('Họ và tên không được để trống.');
      return;
    }

    if (phone.trim() && !/^\+?[0-9]{8,15}$/.test(phone.replace(/[()\s-]/g, ''))) {
      setProfileError('Số điện thoại không hợp lệ (cần từ 8 đến 15 chữ số).');
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setProfileSuccess('Cập nhật thông tin tài khoản thành công!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(err.message);
      } else {
        setProfileError('Không thể cập nhật thông tin cá nhân.');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      setPasswordSuccess(res.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Đổi mật khẩu không thành công.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Đang tải thông tin tài khoản…</p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="page" style={{ padding: '3rem 1rem', maxWidth: '520px', margin: '0 auto' }}>
        <div
          className="auth-card"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <User size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--text)' }}>
            Tài khoản thành viên
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Vui lòng đăng nhập để xem thông tin cá nhân, cập nhật địa chỉ giao hàng và quản lý đơn hàng của bạn.
          </p>
          <Link
            href="/login?redirect=/profile"
            className="btn btn--block btn--primary"
            style={{
              display: 'block',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
            data-testid="profile-login-btn"
          >
            Đăng nhập ngay
          </Link>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--muted)' }}>Chưa có tài khoản? </span>
            <Link href="/register?redirect=/profile" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Đăng ký thành viên
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const roleLabels: Record<string, string> = {
    CUSTOMER: 'Thành viên thân thiết',
    BARISTA: 'Nhân viên pha chế',
    MANAGER: 'Quản lý cửa hàng',
    ADMIN: 'Quản trị viên hệ thống',
  };

  return (
    <main className="page profile-page" style={{ padding: '2rem 1rem', maxWidth: '860px', margin: '0 auto' }}>
      {/* User Header Profile Card */}
      <section
        className="profile-header-card"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c27847 0%, #e09968 100%)',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {(user.fullName || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)' }} data-testid="profile-name">
              {user.fullName || 'Khách hàng BrewLite'}
            </h1>
            <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0.4rem', fontSize: '0.9rem' }}>
              <Mail size={13} style={{ display: 'inline', marginRight: '0.35rem' }} />
              {user.email}
            </p>
            <span
              style={{
                display: 'inline-block',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
              }}
            >
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 0.9rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="profile-logout-btn"
        >
          <LogOut size={14} />
          <span>Đăng xuất</span>
        </button>
      </section>

      {/* Quick Access Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link
          href="/orders"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ padding: '0.6rem', background: '#f5f0eb', borderRadius: '10px', color: 'var(--accent)' }}>
              <ShoppingBag size={22} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '1rem' }}>Đơn hàng của bạn</strong>
              <small style={{ color: 'var(--muted)' }}>Theo dõi tiến trình & lịch sử</small>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--muted)' }} />
        </Link>

        <Link
          href="/loyalty"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ padding: '0.6rem', background: '#fff8e1', borderRadius: '10px', color: '#f59e0b' }}>
              <Sparkles size={22} />
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: '1rem' }}>Ưu đãi & Tích điểm</strong>
              <small style={{ color: 'var(--muted)' }}>Đổi quà và voucher giảm giá</small>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--muted)' }} />
        </Link>
      </div>

      {/* Profile Form Card with Tabs */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.65rem 0.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'profile' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            data-testid="tab-profile"
          >
            <User size={16} />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              padding: '0.65rem 0.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'password' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'password' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            data-testid="tab-password"
          >
            <KeyRound size={16} />
            <span>Bảo mật & Mật khẩu</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'profile' && (
          <div>
            {profileSuccess && (
              <div
                style={{
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                data-testid="profile-success-msg"
              >
                <CheckCircle size={18} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div
                style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                data-testid="profile-error-msg"
              >
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Email (Readonly) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: '#f5f5f5',
                      color: 'var(--muted)',
                      cursor: 'not-allowed',
                    }}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    Email được dùng làm mã định danh và không thể thay đổi.
                  </small>
                </div>

                {/* Họ và tên */}
                <div>
                  <label htmlFor="profile-fullname" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    id="profile-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                    data-testid="profile-fullname-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Số điện thoại */}
                <div>
                  <label htmlFor="profile-phone" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                    data-testid="profile-phone-input"
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    Dùng để Barista hoặc shipper liên hệ khi giao nhận đơn hàng.
                  </small>
                </div>

                {/* Vai trò */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                    Cấp độ tài khoản
                  </label>
                  <input
                    type="text"
                    value={roleLabels[user.role] || user.role}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: '#f5f5f5',
                      color: 'var(--muted)',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>

              {/* Địa chỉ giao hàng mặc định */}
              <div>
                <label htmlFor="profile-address" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Địa chỉ nhận hàng mặc định
                </label>
                <textarea
                  id="profile-address"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontFamily: 'inherit',
                  }}
                  data-testid="profile-address-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={profileSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: profileSaving ? 'not-allowed' : 'pointer',
                  }}
                  data-testid="save-profile-btn"
                >
                  <Save size={16} />
                  <span>{profileSaving ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU */}
        {activeTab === 'password' && (
          <div>
            {passwordSuccess && (
              <div
                style={{
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                data-testid="password-success-msg"
              >
                <CheckCircle size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                data-testid="password-error-msg"
              >
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '1.25rem', maxWidth: '480px' }}>
              <div>
                <label htmlFor="current-password" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Mật khẩu hiện tại <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                  data-testid="current-password-input"
                />
              </div>

              <div>
                <label htmlFor="new-password" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Mật khẩu mới (ít nhất 8 ký tự) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                  data-testid="new-password-input"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Xác nhận mật khẩu mới <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                  data-testid="confirm-password-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: passwordSaving ? 'not-allowed' : 'pointer',
                  }}
                  data-testid="change-password-btn"
                >
                  <KeyRound size={16} />
                  <span>{passwordSaving ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
