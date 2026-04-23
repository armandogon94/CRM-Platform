import React from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

/**
 * A single Toast variant's rendering concerns — purely presentational. The
 * state machine (which toasts exist, when they auto-close, stack order)
 * lives in `ToastProvider`. Keeping render and state separate means the
 * provider can be swapped without touching the visual layer, and the
 * visual layer can be unit-tested by feeding it a fixed `ToastMessage`.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  // `undefined` → use the provider's default (5000ms).
  // `null`      → persist indefinitely (manual dismiss only).
  // `number`    → auto-close after that many ms.
  autoCloseMs?: number | null;
}

// Error + warning are urgent state changes that assistive tech should
// announce immediately; success + info are status updates that can wait
// for the next polite-live-region cycle. Mirrors ARIA guidance.
const VARIANT_ROLE: Record<ToastVariant, 'alert' | 'status'> = {
  error: 'alert',
  warning: 'alert',
  success: 'status',
  info: 'status',
};

// Use `LucideIcon` indirectly via React.ElementType — the lucide icons
// are `ForwardRefExoticComponent` and accept broader props than a plain
// {size, className} FC type can describe. ElementType keeps the map
// assignable without fighting the upstream signature.
const VARIANT_ICON: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_COLORS: Record<ToastVariant, { border: string; iconColor: string; bg: string }> = {
  success: { border: 'border-green-200', iconColor: 'text-green-600', bg: 'bg-green-50' },
  error: { border: 'border-red-200', iconColor: 'text-red-600', bg: 'bg-red-50' },
  warning: { border: 'border-amber-200', iconColor: 'text-amber-600', bg: 'bg-amber-50' },
  info: { border: 'border-blue-200', iconColor: 'text-blue-600', bg: 'bg-blue-50' },
};

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const role = VARIANT_ROLE[toast.variant];
  const Icon = VARIANT_ICON[toast.variant];
  const colors = VARIANT_COLORS[toast.variant];

  return (
    <div
      role={role}
      className={`flex items-start gap-3 w-80 p-4 rounded-lg shadow-lg border ${colors.border} ${colors.bg} pointer-events-auto`}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${colors.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900">{toast.title}</div>
        {toast.description && (
          <div className="mt-1 text-sm text-gray-600">{toast.description}</div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
