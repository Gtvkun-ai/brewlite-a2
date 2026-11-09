'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { fullName?: string; email?: string; password?: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn';
    }

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
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      router.push(redirectPath);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorMessage('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
        } else {
          setErrorMessage(err.message || 'Đăng ký tài khoản không thành công.');
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
      <h1 className="auth-card__title">Đăng ký tài khoản</h1>
      <p className="auth-card__subtitle">Tạo tài khoản để đặt đồ uống nhanh chóng tại BrewLite ☕</p>

      {errorMessage && (
        <div className="alert alert--error" data-testid="register-error">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="form">
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">
            Họ và tên <span className="text-danger">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            className={`form-input ${fieldErrors.fullName ? 'form-input--error' : ''}`}
            placeholder="Nguyễn Văn An"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            data-testid="register-fullname"
            disabled={isLoading}
          />
          {fieldErrors.fullName && (
            <p className="form-error" data-testid="fullname-error">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Địa chỉ Email <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${fieldErrors.email ? 'form-input--error' : ''}`}
            placeholder="an.nguyen@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            data-testid="register-email"
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
            Mật khẩu (tối thiểu 8 ký tự) <span className="text-danger">*</span>
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
            data-testid="register-password"
            disabled={isLoading}
          />
          {fieldErrors.password && (
            <p className="form-error" data-testid="password-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            Số điện thoại (tùy chọn)
          </label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            placeholder="0901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="register-phone"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="btn btn--block btn--primary"
          disabled={isLoading}
          data-testid="register-submit"
        >
          {isLoading ? 'Đang tạo tài khoản…' : 'Đăng ký ngay'}
        </button>
      </form>

      <div className="auth-card__footer">
        <p>
          Đã có tài khoản?{' '}
          <Link
            href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
            className="link"
            data-testid="to-login-link"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="page">
      <Suspense fallback={<div className="page-loading">Đang tải biểu mẫu…</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
