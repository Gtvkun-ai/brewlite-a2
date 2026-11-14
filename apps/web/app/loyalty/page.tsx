'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Gift,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Coffee,
  Crown,
  Tag,
  Star,
  ShieldCheck,
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

  // Điểm mẫu hoặc dựa trên tài khoản
  const currentPoints = isAuthenticated ? 65 : 0;
  const currentTier = currentPoints >= 300 ? 'Kim Cương' : currentPoints >= 150 ? 'Vàng' : currentPoints >= 50 ? 'Bạc' : 'Đồng';

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <main className="page loyalty-page" data-testid="loyalty-page">
      {/* Loyalty Hero */}
      <section className="loyalty-hero">
        <div className="loyalty-hero__glow" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge--accent">
              <Crown size={14} className="inline mr-1 text-amber-300" />
              BrewLite Rewards
            </span>
            <span className="text-xs text-amber-200">Chương trình khách hàng thân thiết</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 font-serif">
            Tích điểm trọn vị, đổi ngàn ưu đãi
          </h1>
          <p className="text-amber-100/85 text-sm sm:text-base max-w-xl">
            Tích <strong>1 điểm</strong> cho mỗi 10.000 ₫ thanh toán. Đổi điểm lấy voucher giảm trực tiếp cho đơn hàng cà phê & trà tiếp theo!
          </p>

          {/* VIP Member Status Card */}
          <div className="loyalty-vip-card">
            <div>
              <div className="text-xs text-amber-200/90 uppercase tracking-wider font-semibold mb-1">
                {isAuthenticated ? 'Hội viên thân thiết' : 'Trạng thái tài khoản'}
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isAuthenticated ? (user?.fullName || user?.email) : 'Chưa đăng nhập'}</span>
                {isAuthenticated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
                    Hạng {currentTier}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-amber-200/80">Điểm khả dụng:</div>
                <div className="text-2xl font-black text-amber-300">
                  {currentPoints} <span className="text-xs font-normal text-white">điểm</span>
                </div>
              </div>
              {!isAuthenticated && (
                <Link href="/login" className="btn btn--primary text-xs py-1.5 px-3">
                  Đăng nhập tích điểm
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Voucher Exchange Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text font-serif">Gói Voucher đổi điểm</h2>
            <p className="text-xs text-muted">Sao chép mã voucher và nhập vào đơn hàng khi thanh toán</p>
          </div>
          <Link href="/" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
            <span>Vào Menu đặt món</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="loyalty-tiers-grid">
          {VOUCHER_TIERS.map((tier) => {
            const canRedeem = currentPoints >= tier.pointsCost;
            const isCopied = copiedCode === tier.code;

            return (
              <div
                key={tier.id}
                className={`loyalty-tier-card ${tier.isPopular ? 'loyalty-tier-card--featured' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge--accent">
                      <Tag size={12} className="inline mr-1" />
                      Giảm {formatVnd(tier.discountAmount)}
                    </span>
                    {tier.isPopular && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Phổ biến
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-text mb-1 font-serif">
                    Voucher {formatVnd(tier.discountAmount)}
                  </h3>
                  <p className="text-xs text-muted mb-3">
                    Đơn tối thiểu: <strong>{formatVnd(tier.minOrderValue)}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-muted">Chi phí đổi:</span>
                    <strong className="text-accent font-bold text-sm">
                      {tier.pointsCost} điểm
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(tier.code)}
                    className="w-full btn btn--secondary text-xs flex items-center justify-center gap-1.5 py-2"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã sao chép mã {tier.code}</span>
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

      {/* Membership Tiers & Perks */}
      <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2 font-serif">
          <Award size={20} className="text-accent" />
          <span>Đặc quyền các hạng hội viên</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <div className="font-bold text-sm text-stone-800 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
              <span>Hạng Đồng (Bronze)</span>
            </div>
            <p className="text-xs text-muted">0 - 49 điểm</p>
            <ul className="text-xs text-muted mt-2 space-y-1">
              <li>• Tích điểm 10k = 1 điểm</li>
              <li>• Nhận ưu đãi thành viên mới</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="font-bold text-sm text-amber-900 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Hạng Bạc (Silver)</span>
            </div>
            <p className="text-xs text-muted">50 - 149 điểm</p>
            <ul className="text-xs text-muted mt-2 space-y-1">
              <li>• Tất cả quyền lợi Hạng Đồng</li>
              <li>• Voucher sinh nhật 15%</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
            <div className="font-bold text-sm text-orange-950 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Hạng Vàng (Gold)</span>
            </div>
            <p className="text-xs text-muted">150 - 299 điểm</p>
            <ul className="text-xs text-muted mt-2 space-y-1">
              <li>• Tặng 1 topping miễn phí / đơn</li>
              <li>• Ưu đãi ngày hội thành viên</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
            <div className="font-bold text-sm text-purple-950 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Kim Cương (Diamond)</span>
            </div>
            <p className="text-xs text-muted">Từ 300 điểm</p>
            <ul className="text-xs text-muted mt-2 space-y-1">
              <li>• Ưu tiên chuẩn bị đơn hàng</li>
              <li>• Quà tri ân đặc biệt cuối năm</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Back to Menu CTA */}
      <div className="text-center pt-2">
        <Link href="/" className="btn btn--primary px-8 py-3 rounded-full text-base font-bold shadow-md">
          <Coffee size={18} className="inline mr-2" />
          <span>Đặt đồ uống ngay để tích điểm</span>
        </Link>
      </div>
    </main>
  );
}
