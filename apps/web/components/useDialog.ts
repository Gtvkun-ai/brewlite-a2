'use client';

import { useEffect, useRef } from 'react';

/** Keep keyboard focus and scrolling inside an open modal surface. */
export function useDialog(open: boolean, onClose: () => void) {
  const surface = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(surface.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    ) ?? []);
    (focusable()[0] ?? surface.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      const focusOutside = !surface.current?.contains(document.activeElement);
      if (!first || !last) {
        event.preventDefault();
        surface.current?.focus();
      } else if (event.shiftKey && (focusOutside || document.activeElement === first || document.activeElement === surface.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focusOutside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return surface;
}
