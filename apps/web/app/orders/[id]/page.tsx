'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { OrderStepper } from '../../../components/OrderStepper';
import { Error as ErrorState, Loading } from '../../../components/States';
import { ApiError } from '../../../lib/api';
import { formatDateTime, formatVnd } from '../../../lib/format';
import { fetchOrder, isUsingFixtures } from '../../../lib/orders-api';
import type { OrderResponse } from '../../../lib/types';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; order: OrderResponse };

function toMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Please sign in to view this order.';
    if (err.status === 403) return 'You do not have permission to view this order.';
    if (err.status === 404) return 'Order not found.';
  }
  return 'Could not load this order.';
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'ready', order: await fetchOrder(id) });
    } catch (err) {
      setState({ kind: 'error', message: toMessage(err) });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main>
      <Link href="/orders">← Order history</Link>
      {isUsingFixtures && (
        <p data-testid="fixture-banner">Sample data (fixture) – not a real order.</p>
      )}
      {state.kind === 'loading' && <Loading label="Loading order…" />}
      {state.kind === 'error' && (
        <ErrorState message={state.message} onRetry={load} />
      )}
      {state.kind === 'ready' && (
        <>
          <h1>Order #{state.order.code}</h1>
          <p>{formatDateTime(state.order.createdAt)}</p>
          <OrderStepper status={state.order.status} />
          <ul>
            {state.order.items.map((it) => (
              <li key={it.id}>
                {it.productName} × {it.quantity} – {formatVnd(it.itemTotal)}
                <br />
                <small>
                  Size {it.selectedSize}
                  {it.selectedToppings.length > 0 &&
                    `, ${it.selectedToppings.join(', ')}`}
                </small>
              </li>
            ))}
          </ul>
          <p>Total: {formatVnd(state.order.totalAmount)}</p>
        </>
      )}
    </main>
  );
}