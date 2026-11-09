import type { OrderStatus } from '../lib/types';

export const ORDER_STEPS: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
];

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending payment',
  PAID: 'Paid',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed',
};

export function statusLabel(status: OrderStatus): string {
  return LABELS[status];
}

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') {
    return (
      <div role="alert" data-testid="order-terminal-state">
        {LABELS[status]}
      </div>
    );
  }

  const current = ORDER_STEPS.indexOf(status);

  return (
    <ol aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => (
        <li
          key={step}
          data-testid={`step-${step}`}
          data-state={i < current ? 'done' : i === current ? 'current' : 'upcoming'}
          aria-current={i === current ? 'step' : undefined}
        >
          {LABELS[step]}
        </li>
      ))}
    </ol>
  );
}