'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { forgotPasswordApi, resetPasswordApi } from '../../lib/auth-api';
import { ApiError } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      setSuccessMessage(res.message);
      setMode('reset');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể gửi yêu cầu đặt lại mật khẩu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email tài khoản.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordApi({
        email: email.trim(),
        newPassword,
        token: resetToken.trim() || undefined,
      });
      setSuccessMessage(res.message);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể đặt lại mật khẩu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page" style={{ padding: '2rem 1rem', maxWidth: '520px', margin: '0 auto' }}>
      <div className="auth-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '2rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
        <h1 className="auth-card__title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
          {mode === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu mới'}
        </h1>
        <p className="auth-card__subtitle" style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          {mode === 'request'
            ? 'Nhập địa chỉ email đăng ký để nhận liên kết khôi phục mật khẩu.'
            : 'Nhập thông tin mật khẩu mới cho tài khoản của bạn.'}
        </p>

        {successMessage && (
          <div className="alert alert--success" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} data-testid="reset-success">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert--error" style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} data-testid="reset-error">
            ⚠️ {errorMessage}
          </div>
        )}

        {mode === 'request' ? (
          <form onSubmit={handleRequestReset} className="form" style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Địa chỉ Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                placeholder="vi-du@brewlite.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="forgot-email-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--block btn--primary"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              disabled={isLoading}
              data-testid="forgot-submit-btn"
            >
              {isLoading ? 'Đang gửi yêu cầu…' : 'Gửi liên kết khôi phục'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="form" style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Địa chỉ Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-password" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Mật khẩu mới (ít nhất 8 ký tự) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="reset-new-password"
                type="password"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                data-testid="reset-new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm-password" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Xác nhận mật khẩu mới <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                data-testid="reset-confirm-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--block btn--primary"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              disabled={isLoading}
              data-testid="reset-submit-btn"
            >
              {isLoading ? 'Đang cập nhật…' : 'Xác nhận đổi mật khẩu mới'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
          <Link href="/login" className="link" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
