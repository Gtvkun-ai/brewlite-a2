import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OrderStepper } from '../components/OrderStepper';

afterEach(cleanup);

describe('OrderStepper', () => {
  it('marks done, current and upcoming steps for PREPARING', () => {
    render(<OrderStepper status="PREPARING" />);
    expect(screen.getByTestId('step-PENDING')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('step-PAID')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('step-PREPARING')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('step-READY')).toHaveAttribute('data-state', 'upcoming');
    expect(screen.getByTestId('step-COMPLETED')).toHaveAttribute('data-state', 'upcoming');
  });

  it('marks only the first step as current for PENDING', () => {
    render(<OrderStepper status="PENDING" />);
    expect(screen.getByTestId('step-PENDING')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('step-PAID')).toHaveAttribute('data-state', 'upcoming');
  });

  it('marks all earlier steps as done for COMPLETED', () => {
    render(<OrderStepper status="COMPLETED" />);
    expect(screen.getByTestId('step-READY')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('step-COMPLETED')).toHaveAttribute('data-state', 'current');
  });

  it.each(['PAYMENT_FAILED', 'CANCELLED'] as const)(
    'shows a terminal state instead of the stepper for %s',
    (status) => {
      render(<OrderStepper status={status} />);
      expect(screen.getByTestId('order-terminal-state')).toBeInTheDocument();
      expect(screen.queryByTestId('step-PAID')).not.toBeInTheDocument();
    },
  );
});