import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Toast, type ToastMessage } from './Toast';

/**
 * ToastProvider — slice-20 error-surface primitive.
 *
 * Mounted once per app at the root (below <BrowserRouter> / above every
 * route). Exposes a stable `{ show, dismiss }` hook so industry App
 * shells, shared components (BoardListPage, useBoard mutations), and
 * future slices can all emit toasts through the same surface.
 *
 * Design choices:
 *   - Stack renders bottom-right, newest at the bottom (reading order).
 *   - Escape dismisses the most-recent toast only (§ Toast.test.tsx:
 *     "Escape key dismisses the most-recent toast").
 *   - Auto-close is per-toast; null keeps the message persistent for
 *     high-severity cases (quota errors, 5xx) where silent dismissal
 *     would be misleading.
 *   - Ref'd latest stack in the Escape handler so adding a new toast
 *     mid-lifetime doesn't require re-attaching the listener.
 */

export type { ToastMessage, ToastVariant } from './Toast';

export interface ToastContextValue {
  show(msg: Omit<ToastMessage, 'id'>): string;
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_AUTO_CLOSE_MS = 5000;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Keep the latest stack in a ref so the document-level keydown handler
  // can always read the freshest state without the listener churning on
  // every state change.
  const toastsRef = useRef<ToastMessage[]>([]);
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const dismiss = useCallback<ToastContextValue['dismiss']>((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue['show']>((msg) => {
    const id = nextId();
    const toast: ToastMessage = { id, ...msg };
    setToasts((prev) => [...prev, toast]);

    const resolvedAutoClose =
      msg.autoCloseMs === null
        ? null
        : msg.autoCloseMs ?? DEFAULT_AUTO_CLOSE_MS;
    if (resolvedAutoClose !== null) {
      // Schedule dismissal — setTimeout is fine here because the consumer
      // can still manual-dismiss before the timer fires (idempotent).
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, resolvedAutoClose);
    }

    return id;
  }, []);

  // Escape-to-dismiss — always dismisses the most-recent toast so a
  // stack of queued errors doesn't trap the user behind a single key
  // press.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const stack = toastsRef.current;
      if (stack.length === 0) return;
      const last = stack[stack.length - 1];
      setToasts((prev) => prev.filter((t) => t.id !== last.id));
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      'useToast() must be called inside a <ToastProvider>. Mount <ToastProvider> at your app root.'
    );
  }
  return ctx;
}
