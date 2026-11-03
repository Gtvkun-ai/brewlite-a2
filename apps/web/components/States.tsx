'use client';

/** Reusable Loading / Empty / Error UI states shared across pages (ADR-002). */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <p>{label}</p>
    </div>
  );
}

export function Empty({
  title = 'Nothing here yet',
  message = 'There are no items to show right now.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      <p>{message}</p>
    </div>
  );
}

export function Error({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="state" role="alert">
      <p className="state__title">Unable to load</p>
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
