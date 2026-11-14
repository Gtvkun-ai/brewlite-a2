'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatVnd } from '../../lib/format';

type DemoBankConfirmationProps = {
  amount: string;
  content: string;
  reference: string;
};

export default function DemoBankConfirmation({
  amount,
  content,
  reference,
}: DemoBankConfirmationProps) {
  const [confirmed, setConfirmed] = useState(false);
  const numericAmount = Number(amount);
  const isValidPayment = Number.isSafeInteger(numericAmount) && numericAmount > 0 && content.length > 0;

  return (
    <main className="page demo-bank-page">
      <section className="demo-bank-shell" aria-label="BrewLite Demo Bank">
        <header className="demo-bank__topbar">
          <Link href="/checkout" className="demo-bank__back">
            ← BrewLite
          </Link>
          <span className="demo-bank__demo-badge">DEMO</span>
        </header>

        <div className="demo-bank__body">
          <div className="demo-bank__brand">
            <span className="demo-bank__brand-mark" aria-hidden="true">B</span>
            <div>
              <strong>BrewLite Bank</strong>
              <span>Màn hình thanh toán mô phỏng</span>
            </div>
          </div>

          {!isValidPayment ? (
            <div className="demo-bank__invalid" role="alert">
              Mã thanh toán không hợp lệ hoặc thiếu số tiền/nội dung.
            </div>
          ) : confirmed ? (
            <div className="demo-bank__confirmed" role="status" aria-live="polite">
              <span className="demo-bank__check" aria-hidden="true">✓</span>
              <h1>Đã xác nhận thanh toán demo</h1>
              <p>Đây chỉ là giao dịch mô phỏng. Không có tiền thật được chuyển.</p>
              <Link href="/checkout" className="demo-bank__return">
                Quay lại BrewLite
              </Link>
            </div>
          ) : (
            <>
              <div className="demo-bank__heading">
                <span>Chuyển khoản đến</span>
                <h1>BrewLite Coffee</h1>
              </div>

              <div className="demo-bank__amount">
                <span>Số tiền thanh toán</span>
                <strong>{formatVnd(numericAmount)}</strong>
              </div>

              <dl className="demo-bank__details">
                <div>
                  <dt>Ngân hàng nhận</dt>
                  <dd>BrewLite Bank Demo</dd>
                </div>
                <div>
                  <dt>Tên người nhận</dt>
                  <dd>BREWLITE COFFEE (DEMO)</dd>
                </div>
                <div>
                  <dt>Nội dung chuyển khoản</dt>
                  <dd className="demo-bank__memo">{content}</dd>
                </div>
                <div>
                  <dt>Mã tham chiếu</dt>
                  <dd>{reference || '—'}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="demo-bank__confirm"
                onClick={() => setConfirmed(true)}
              >
                Xác nhận thanh toán
              </button>
              <p className="demo-bank__notice">
                Màn hình ngân hàng minh họa: nút xác nhận không thực hiện giao dịch thật.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
