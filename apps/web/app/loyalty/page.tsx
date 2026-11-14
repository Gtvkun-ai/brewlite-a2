'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Crown,
  Gift,
  Tag,
  Copy,
  Check,
  ArrowRight,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatVnd } from '../../lib/format';

interface VoucherTier {
  id: string;
  code: string;
  pointsCost: number;
  discountAmount: number;
  minOrderValue: number;
  isPopular?: boolean;
}

const VOUCHER_TIERS: VoucherTier[] = [
  {
    id: 'tier-10k',
    code: 'BREW10K',
    pointsCost: 10,
    discountAmount: 10000,
    minOrderValue: 20000,
  },
  {
    id: 'tier-20k',
    code: 'BREW20K',
    pointsCost: 20,
    discountAmount: 20000,
    minOrderValue: 40000,
    isPopular: true,
  },
  {
    id: 'tier-50k',
    code: 'BREW50K',
    pointsCost: 50,
    discountAmount: 50000,
    minOrderValue: 80000,
  },
  {
    id: 'tier-100k',
    code: 'BREW100K',
    pointsCost: 100,
    discountAmount: 100000,
    minOrderValue: 150000,
  },
];

export default function LoyaltyPage() {
  const { user, isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const currentPoints = isAuthenticated ? 65 : 0;
  const currentTier =
    currentPoints >= 300
      ? 'Kim Cương'
      : currentPoints >= 150
        ? 'Vàng'
        : currentPoints >= 50
          ? 'Bạc'
          : 'Đồng';

  const handleCopy = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <main className="loyalty-container" data-testid="loyalty-page">
      {/* Loyalty Header Banner */}
      <section className="loyalty-banner" aria-label="BrewLite Rewards">
        <div>
          <div className="loyalty-banner__tag">
            <Crown size={14} />
            <span>BrewLite Rewards · Khách Hàng Thân Thiết</span>
          </div>
          <h1 className="loyalty-banner__title">Tích Điểm Trọn Vị, Đổi Ngàn Ưu Đãi</h1>
          <p className="loyalty-banner__subtitle">
            Tích <strong>1 điểm</strong> cho mỗi 10.000 ₫ thanh toán. Đổi điểm lấy voucher giảm trực tiếp cho các đơn hàng cà phê & trà tiếp theo!
          </p>
        </div>

        {/* Member Stat Card */}
        <div className="loyalty-stat-card">
          <div className="loyalty-stat-card__label">
            {isAuthenticated ? (user?.fullName || user?.email?.split('@')[0]) : 'Khách vãng lai'}
          </div>
          <div className="loyalty-stat-card__points">
            {currentPoints} <span>điểm</span>
          </div>
          <div className="loyalty-stat-card__tier">
            Hạng {currentTier}
          </div>
        </div>
      </section>

      {/* Voucher Exchange Section */}
      <section aria-label="Gói Voucher Đổi Điểm">
        <div className="loyalty-section-header">
          <div>
            <h2 className="loyalty-section-title">Gói Voucher Đổi Điểm</h2>
            <p className="loyalty-section-subtitle">
              Sao chép mã voucher và nhập vào ô ghi chú đơn hàng khi thanh toán
            </p>
          </div>
          <Link
            href="/"
            className="navbar__link"
            style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <span>Vào Menu đặt món</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="voucher-cards-grid">
          {VOUCHER_TIERS.map((tier) => {
            const isCopied = copiedCode === tier.code;

            return (
              <div
                key={tier.id}
                className={`voucher-item-card ${tier.isPopular ? 'voucher-item-card--popular' : ''}`}
              >
                <div>
                  <div className="voucher-item-card__badge-row">
                    <span className="voucher-discount-pill">
                      <Tag size={11} />
                      <span>Giảm {formatVnd(tier.discountAmount)}</span>
                    </span>
                    {tier.isPopular && (
                      <span className="voucher-popular-pill">Phổ biến</span>
                    )}
                  </div>

                  <h3 className="voucher-item-card__title">
                    Voucher {formatVnd(tier.discountAmount)}
                  </h3>
                  <p className="voucher-item-card__rule">
                    Đơn tối thiểu: <strong>{formatVnd(tier.minOrderValue)}</strong>
                  </p>
                </div>

                <div className="voucher-item-card__bottom">
                  <div className="voucher-item-card__cost">
                    <span>Chi phí đổi:</span>
                    <strong>{tier.pointsCost} điểm</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(tier.code)}
                    className={`voucher-copy-btn ${isCopied ? 'voucher-copy-btn--copied' : ''}`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>Đã chép mã {tier.code}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Sao chép mã {tier.code}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Membership Perks */}
      <section className="perks-card-container" aria-label="Đặc quyền hội viên">
        <h2 className="loyalty-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="var(--accent)" />
          <span>Đặc Quyền Các Hạng Hội Viên</span>
        </h2>
        <p className="loyalty-section-subtitle">
          Thăng hạng tự động dựa trên tổng điểm tích lũy trong năm
        </p>

        <div className="perks-grid">
          <div className="perk-box">
            <div className="perk-box__header">
              <span className="perk-box__badge">Cấp 1</span>
              <h3 className="perk-box__name">Hạng Đồng</h3>
            </div>
            <div className="perk-box__points">0 – 49 điểm</div>
            <ul className="perk-box__list">
              <li>Tích điểm 10.000 ₫ = 1 điểm</li>
              <li>Nhận quà tặng thành viên mới</li>
            </ul>
          </div>

          <div className="perk-box" style={{ background: '#fff9f5', borderColor: '#ebd0be' }}>
            <div className="perk-box__header">
              <span className="perk-box__badge" style={{ background: '#f7ede5', color: '#9d592b' }}>Cấp 2</span>
              <h3 className="perk-box__name">Hạng Bạc</h3>
            </div>
            <div className="perk-box__points">50 – 149 điểm</div>
            <ul className="perk-box__list">
              <li>Mọi quyền lợi Hạng Đồng</li>
              <li>Voucher sinh nhật giảm 15%</li>
            </ul>
          </div>

          <div className="perk-box" style={{ background: '#fff8f0', borderColor: '#f4c391' }}>
            <div className="perk-box__header">
              <span className="perk-box__badge" style={{ background: '#fceddd', color: '#b25712' }}>Cấp 3</span>
              <h3 className="perk-box__name">Hạng Vàng</h3>
            </div>
            <div className="perk-box__points">150 – 299 điểm</div>
            <ul className="perk-box__list">
              <li>Miễn phí 1 topping / mọi đơn</li>
              <li>Ưu đãi nhân đôi điểm ngày VIP</li>
            </ul>
          </div>

          <div className="perk-box" style={{ background: '#faf5ff', borderColor: '#d8b4fe' }}>
            <div className="perk-box__header">
              <span className="perk-box__badge" style={{ background: '#f3e8ff', color: '#6b21a8' }}>Cấp 4</span>
              <h3 className="perk-box__name">Kim Cương</h3>
            </div>
            <div className="perk-box__points">Từ 300 điểm</div>
            <ul className="perk-box__list">
              <li>Ưu tiên pha chế nhanh</li>
              <li>Hộp quà tri ân thượng hạng cuối năm</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Back to Menu CTA */}
      <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
        <Link href="/" className="btn btn--primary" style={{ padding: '0.85rem 2rem', borderRadius: '999px', fontSize: '0.95rem' }}>
          <Coffee size={17} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          <span>Khám phá thực đơn & Tích điểm ngay</span>
        </Link>
      </div>
    </main>
  );
}
