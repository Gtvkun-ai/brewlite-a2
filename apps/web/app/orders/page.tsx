'use client';
// trang danh sách đơn
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { statusLabel } from '../../components/OrderStepper';
import { Empty, Error as ErrorState, Loading } from '../../components/States';
import { ApiError } from '../../lib/api';
import { formatDateTime, formatVnd } from '../../lib/format';
import { fetchOrders, isUsingFixtures } from '../../lib/orders-api';
import type { OrderResponse } from '../../lib/types';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; orders: OrderResponse[] };

function toMessage(err: unknown): string {
  if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
    return 'Please sign in to view your orders.';
  }
  return 'Could not load your orders.';
}

export default function OrdersPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'ready', orders: await fetchOrders() });
    } catch (err) {
      setState({ kind: 'error', message: toMessage(err) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main>
      <h1>Order history</h1>
      {isUsingFixtures && (
        <p data-testid="fixture-banner">Sample data (fixture) – not real orders.</p>
      )}
      {state.kind === 'loading' && <Loading label="Loading orders…" />}
      {state.kind === 'error' && (
        <ErrorState message={state.message} onRetry={load} />
      )}
      {state.kind === 'ready' && state.orders.length === 0 && (
        <Empty title="No orders yet" message="Your orders will appear here." />
      )}
      {state.kind === 'ready' && state.orders.length > 0 && (
        <ul>
          {state.orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`}>#{o.code}</Link>{' '}
              <span>{statusLabel(o.status)}</span>{' '}
              <span>{formatDateTime(o.createdAt)}</span>{' '}
              <span>{formatVnd(o.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}