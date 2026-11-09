"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OrderStepper } from "../../../components/OrderStepper";
import { Error as ErrorState, Loading } from "../../../components/States";
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
    if (err.status === 401) return "Please sign in to view this order.";
    if (err.status === 403)
      return "You do not have permission to view this order.";
    if (err.status === 404) return "Order not found.";
  }
  return "Could not load this order.";
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", order: await fetchOrder(id) });
    } catch (err) {
      setState({ kind: "error", message: toMessage(err) });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="page orders-page">
      <Link className="back-link" href="/orders">
        ← Order history
      </Link>

      {isUsingFixtures && (
        <p className="orders-fixture-banner" data-testid="fixture-banner">
          Sample data (fixture) – not a real order.
        </p>
      )}

      {state.kind === "loading" && <Loading label="Loading order…" />}

      {state.kind === "error" && (
        <ErrorState message={state.message} onRetry={load} />
      )}

      {state.kind === "ready" && (
        <section className="order-detail">
          <header className="page__header">
            <h1 className="page__title">Order #{state.order.code}</h1>
            <p className="page__subtitle">
              {formatDateTime(state.order.createdAt)}
            </p>
          </header>

          <section className="order-progress" aria-label="Order progress">
            <h2 className="order-section__title">Order status</h2>
            <OrderStepper status={state.order.status} />
          </section>

          <section className="order-items">
            <h2 className="order-section__title">Order items</h2>
            {state.order.items.length === 0 ? (
              <p>No items in this order.</p>
            ) : (
              <ul className="order-items__list">
                {state.order.items.map((item) => (
                  <li className="order-item" key={item.id}>
                    <div className="order-item__info">
                      <strong>{item.productName}</strong>
                      <span>× {item.quantity}</span>
                    </div>
                    <strong className="order-item__price">
                      {formatVnd(item.itemTotal)}
                    </strong>
                    <small className="order-item__options">
                      Size {item.selectedSize}
                      {item.selectedToppings.length > 0 &&
                        ` · ${item.selectedToppings.join(", ")}`}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="order-total">
            <strong>Total: {formatVnd(state.order.totalAmount)}</strong>
          </section>
        </section>
      )}
    </main>
  );
}
