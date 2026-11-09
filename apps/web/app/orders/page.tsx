"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { statusLabel } from "../../components/OrderStepper";
import { Empty, Error as ErrorState, Loading } from "../../components/States";
import { ApiError } from "../../lib/api";
import { formatDateTime, formatVnd } from "../../lib/format";
import { fetchOrders, isUsingFixtures } from "../../lib/orders-api";
import type { OrderResponse } from "../../lib/types";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; orders: OrderResponse[] };

function toMessage(err: unknown): string {
  if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
    return "Please sign in to view your orders.";
  }
  return "Could not load your orders.";
}

export default function OrdersPage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", orders: await fetchOrders() });
    } catch (err) {
      setState({ kind: "error", message: toMessage(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page orders-page">
      <header className="page__header">
        <h1 className="page__title">Order history</h1>
        <p className="page__subtitle">
          View your recent orders and their status.
        </p>
      </header>

      {isUsingFixtures && (
        <p className="orders-fixture-banner" data-testid="fixture-banner">
          Sample data (fixture) – not real orders.
        </p>
      )}

      {state.kind === "loading" && <Loading label="Loading orders…" />}

      {state.kind === "error" && (
        <ErrorState message={state.message} onRetry={load} />
      )}

      {state.kind === "ready" && state.orders.length === 0 && (
        <Empty title="No orders yet" message="Your orders will appear here." />
      )}

      {state.kind === "ready" && state.orders.length > 0 && (
        <ul className="orders-list">
          {state.orders.map((order) => (
            <li className="orders-card" key={order.id}>
              <div className="orders-card__header">
                <Link
                  className="orders-card__code"
                  href={`/orders/${order.id}`}
                >
                  #{order.code}
                </Link>
                <span className="orders-card__status">
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="orders-card__footer">
                <span className="orders-card__date">
                  {formatDateTime(order.createdAt)}
                </span>
                <strong className="orders-card__total">
                  {formatVnd(order.totalAmount)}
                </strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
