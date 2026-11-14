"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStepper } from "../../../components/OrderStepper";
import { Error as ErrorState, Loading } from "../../../components/States";
import { ICE_OPTIONS, SUGAR_OPTIONS, TOPPING_OPTIONS } from "../../../context/CartContext";
import { ApiError } from "../../../lib/api";
import { formatDateTime, formatVnd } from "../../../lib/format";
import { fetchOrder, isUsingFixtures } from "../../../lib/orders-api";
import type { OrderResponse } from "../../../lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: OrderResponse };

function toMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Vui lòng đăng nhập để xem đơn hàng.";
    if (err.status === 403) return "Bạn không có quyền xem đơn hàng này.";
    if (err.status === 404) return "Không tìm thấy đơn hàng.";
  }
  return "Không thể tải đơn hàng. Vui lòng thử lại.";
}

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "PAYMENT_FAILED"]);
const ORDER_POLL_INTERVAL = 3000;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [retryVersion, setRetryVersion] = useState(0);
  const [refreshError, setRefreshError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setState({ kind: "loading" });
    setRefreshError(false);

    async function refresh(initial = false) {
      try {
        const order = await fetchOrder(id);
        if (!active) return;
        setState({ kind: "ready", order });
        setRefreshError(false);
        setLastUpdated(new Date());
        if (!isUsingFixtures && !TERMINAL_STATUSES.has(order.status)) {
          timer = setTimeout(() => void refresh(), ORDER_POLL_INTERVAL);
        }
      } catch (err) {
        if (!active) return;
        // An expired session or revoked order access must hide the previous data.
        if (initial || (err instanceof ApiError && [401, 403, 404].includes(err.status))) {
          setState({ kind: "error", message: toMessage(err) });
        } else {
          setRefreshError(true);
          timer = setTimeout(() => void refresh(), ORDER_POLL_INTERVAL);
        }
      }
    }

    void refresh(true);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, retryVersion]);

  return (
    <main className="page orders-page">
      <Link className="back-link" href="/orders">← Lịch sử đơn hàng</Link>

      {isUsingFixtures && (
        <p className="orders-fixture-banner" data-testid="fixture-banner">
          Dữ liệu mẫu (fixture) – không phải đơn hàng thật.
        </p>
      )}

      {state.kind === "loading" && <Loading label="Đang tải đơn hàng…" />}
      {state.kind === "error" && (
        <ErrorState message={state.message} onRetry={() => setRetryVersion((value) => value + 1)} />
      )}

      {state.kind === "ready" && (
        <section className="order-detail" data-testid="order-detail">
          <header className="page__header">
            <h1 className="page__title">Chi tiết đơn hàng #{state.order.code}</h1>
            <p className="page__subtitle">{formatDateTime(state.order.createdAt)}</p>
          </header>

          <section className="order-progress" aria-label="Tiến trình đơn hàng">
            <h2 className="order-section__title">Trạng thái đơn hàng</h2>
            <div aria-live="polite" aria-atomic="true">
              <OrderStepper status={state.order.status} />
            </div>
            {!isUsingFixtures && (
              <p className="page__subtitle" role="status" data-testid="order-refresh-status">
                {refreshError
                  ? "Mất kết nối tạm thời. Đang thử cập nhật lại…"
                  : TERMINAL_STATUSES.has(state.order.status)
                    ? "Đã cập nhật trạng thái cuối cùng."
                    : "Tự động cập nhật trạng thái mỗi 3 giây."}
                {lastUpdated && ` Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}.`}
              </p>
            )}
          </section>

          <section className="order-items">
            <h2 className="order-section__title">Món đã đặt</h2>
            {state.order.items.length === 0 ? (
              <p>Đơn hàng chưa có món.</p>
            ) : (
              <ul className="order-items__list">
                {state.order.items.map((item) => (
                  <li className="order-item" key={item.id}>
                    <div className="order-item__info">
                      <strong>{item.productName}</strong><span>× {item.quantity}</span>
                    </div>
                    <strong className="order-item__price">{formatVnd(item.itemTotal)}</strong>
                    <small className="order-item__options">
                      Size {item.selectedSize === 'LARGE' ? 'Large' : 'Regular'}
                      {` · ${SUGAR_OPTIONS.find((option) => option.code === (item.selectedSugar ?? 100))?.label ?? `Đường ${item.selectedSugar ?? 100}%`}`}
                      {` · ${ICE_OPTIONS.find((option) => option.code === (item.selectedIce ?? 'NORMAL'))?.label ?? 'Đá 100%'}`}
                      {item.selectedToppings.length > 0 &&
                        ` · ${item.selectedToppings.map((code) => TOPPING_OPTIONS.find((option) => option.code === code)?.label ?? code).join(", ")}`}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {state.order.deliveryNote && (
            <section className="order-items">
              <h2 className="order-section__title">Ghi chú cho Barista</h2>
              <p>{state.order.deliveryNote}</p>
            </section>
          )}
          <section className="order-total">
            <strong>Tổng thanh toán: {formatVnd(state.order.totalAmount)}</strong>
          </section>
        </section>
      )}
    </main>
  );
}
