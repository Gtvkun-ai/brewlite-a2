import {
  Clock,
  CreditCard,
  Coffee,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
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

const STEP_ICONS: Record<OrderStatus, React.ElementType> = {
  PENDING: Clock,
  PAID: CreditCard,
  PREPARING: Coffee,
  READY: CheckCircle2,
  COMPLETED: PackageCheck,
  CANCELLED: XCircle,
  PAYMENT_FAILED: AlertTriangle,
};

export function statusLabel(status: OrderStatus): string {
  return LABELS[status];
}

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') {
    const Icon = STEP_ICONS[status];
    return (
      <div
        role="alert"
        data-testid="order-terminal-state"
        className={`order-terminal-badge order-terminal-badge--${status.toLowerCase().replace('_', '-')}`}
      >
        <Icon size={20} className="order-terminal-badge__icon" />
        <span>{LABELS[status]}</span>
      </div>
    );
  }

  const current = ORDER_STEPS.indexOf(status);

  return (
    <div className="order-stepper-container">
      <ol aria-label="Order progress" className="order-stepper">
        {ORDER_STEPS.map((step, i) => {
          const Icon = STEP_ICONS[step];
          const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
          return (
            <li
              key={step}
              data-testid={`step-${step}`}
              data-state={state}
              aria-current={i === current ? 'step' : undefined}
              className={`order-stepper__step order-stepper__step--${state}`}
            >
              <div className="order-stepper__node">
                <Icon size={16} className="order-stepper__icon" />
                {state === 'current' && <span className="order-stepper__pulse" />}
              </div>
              <span className="order-stepper__label">{LABELS[step]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
