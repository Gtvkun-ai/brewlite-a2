'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer" data-testid="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* Brand Col */}
          <div className="footer__col footer__col--brand">
            <div className="footer__brand">
              <span className="footer__logo-icon">☕</span>
              <span className="footer__logo-text">BrewLite Coffee & Tea</span>
            </div>
            <p className="footer__tagline">
              Đánh thức mọi giác quan với những hạt cà phê Robusta & Arabica nguyên chất Cầu Đất, kết hợp cùng các dòng trà thanh nhiệt tươi mới mỗi ngày.
            </p>
            <div className="footer__badges">
              <span className="footer__badge">🌱 100% Cà phê sạch</span>
              <span className="footer__badge">⚡ Giao siêu tốc 15p</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h3 className="footer__heading">Khám phá</h3>
            <ul className="footer__list">
              <li>
                <Link href="/" className="footer__link">
                  Thực đơn đồ uống
                </Link>
              </li>
              <li>
                <Link href="/cart" className="footer__link">
                  Giỏ hàng của bạn
                </Link>
              </li>
              <li>
                <Link href="/orders" className="footer__link">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/login" className="footer__link">
                  Tài khoản thành viên
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy */}
          <div className="footer__col">
            <h3 className="footer__heading">Chính sách & Hỗ trợ</h3>
            <ul className="footer__list">
              <li>
                <span className="footer__text">Cam kết chất lượng đồ uống</span>
              </li>
              <li>
                <span className="footer__text">Chính sách hủy đơn & hoàn tiền</span>
              </li>
              <li>
                <span className="footer__text">Bảo mật thông tin khách hàng</span>
              </li>
              <li>
                <span className="footer__text">Giao hàng & Đóng gói vệ sinh</span>
              </li>
            </ul>
          </div>

          {/* Contact / Store info */}
          <div className="footer__col">
            <h3 className="footer__heading">Cửa hàng BrewLite</h3>
            <ul className="footer__list">
              <li className="footer__info-item">
                <span className="footer__info-icon">📍</span>
                <span className="footer__text">273 An Dương Vương, P.3, Quận 5, TP.HCM</span>
              </li>
              <li className="footer__info-item">
                <span className="footer__info-icon">📞</span>
                <span className="footer__text">Hotline: 1900 6868 (07:00 - 22:30)</span>
              </li>
              <li className="footer__info-item">
                <span className="footer__info-icon">✉️</span>
                <span className="footer__text">contact@brewlite.vn</span>
              </li>
              <li className="footer__info-item">
                <span className="footer__info-icon">⏰</span>
                <span className="footer__text">Mở cửa: 07:00 - 22:30 (Cả tuần)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2026 BrewLite Coffee. Đồ án môn Công nghệ Phần mềm — Trường Đại học Sài Gòn (SGU).
          </p>
          <p className="footer__version">
            Hệ thống Staging Release v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

