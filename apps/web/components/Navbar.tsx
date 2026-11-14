'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, ShoppingBag, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount } = useCart();
  const pathname = usePathname();

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <Link href="/" className="navbar__logo">
            <span className="navbar__logo-icon-wrap">
              <Coffee className="navbar__logo-icon" size={22} />
            </span>
            <span className="navbar__logo-text">
              Brew<span className="navbar__logo-accent">Lite</span>
            </span>
          </Link>
        </div>

        <div className="navbar__links">
          <Link
            href="/"
            className={`navbar__link ${pathname === '/' ? 'navbar__link--active' : ''}`}
          >
            <span>Menu</span>
          </Link>
          <Link
            href="/cart"
            className={`navbar__link ${pathname === '/cart' ? 'navbar__link--active' : ''}`}
          >
            <span>Giỏ hàng</span>
          </Link>
          <Link
            href="/orders"
            className={`navbar__link ${pathname?.startsWith('/orders') ? 'navbar__link--active' : ''}`}
          >
            <span>Đơn hàng</span>
          </Link>
        </div>

        <div className="navbar__actions">
          {/* Cart Badge Button */}
          <Link
            href="/checkout"
            className="navbar__cart-btn"
            data-testid="cart-link"
            aria-label="Giỏ hàng"
          >
            <span className="navbar__cart-icon">
              <ShoppingBag size={20} />
            </span>
            <span className="navbar__cart-badge" data-testid="cart-badge">
              {totalCount}
            </span>
          </Link>

          {/* User Auth Info */}
          {isAuthenticated && user ? (
            <div className="navbar__user" data-testid="user-info">
              <span className="navbar__username" title={user.email}>
                <User size={15} className="navbar__user-icon" />
                <span>{user.fullName || user.email.split('@')[0]}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="navbar__logout-btn"
                data-testid="logout-btn"
              >
                <LogOut size={14} className="navbar__logout-icon" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="navbar__auth-links">
              <Link
                href="/login"
                className="navbar__auth-link navbar__auth-link--login"
                data-testid="login-link"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="navbar__auth-link navbar__auth-link--register"
                data-testid="register-link"
              >
                <Sparkles size={14} />
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
