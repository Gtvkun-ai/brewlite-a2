'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Email không đúng định dạng';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.push(redirectPath);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('Email hoặc mật khẩu không chính xác.');
        } else {
          setErrorMessage(err.message || 'Đăng nhập không thành công.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-card__title">Đăng nhập tài khoản</h1>
      <p className="auth-card__subtitle">Chào mừng bạn quay lại với BrewLite ☕</p>

      {errorMessage && (
        <div className="alert alert--error" data-testid="login-error">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="form">
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Địa chỉ Email <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${fieldErrors.email ? 'form-input--error' : ''}`}
            placeholder="vi-du@brewlite.vn"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            data-testid="login-email"
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <p className="form-error" data-testid="email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Mật khẩu <span className="text-danger">*</span>
          </label>
          <input
            id="password"
            type="password"
            className={`form-input ${fieldErrors.password ? 'form-input--error' : ''}`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            data-testid="login-password"
            disabled={isLoading}
          />
          {fieldErrors.password && (
            <p className="form-error" data-testid="password-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--block btn--primary"
          disabled={isLoading}
          data-testid="login-submit"
        >
          {isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <div className="auth-card__footer">
        <p>
          Chưa có tài khoản?{' '}
          <Link
            href={`/register${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
            className="link"
            data-testid="to-register-link"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="page">
      <Suspense fallback={<div className="page-loading">Đang tải biểu mẫu…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
