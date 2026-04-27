import { useEffect, useId, useRef } from 'react';

/**
 * Reusable confirmation modal — Slice 20 B1.
 *
 * Used for destructive actions that shouldn't be one-click (delete item
 * in KanbanView, future delete-board, clear-all-filters, etc.). Handles
 * accessibility boilerplate so every call-site inherits:
 *
 *   - role="dialog" + aria-modal="true" + aria-labelledby (→ title)
 *   - Initial focus on the Cancel button so Enter doesn't immediately
 *     confirm a destructive action (Material / Ant common pattern)
 *   - Escape key closes (cancel path, never onConfirm)
 *   - Click on the backdrop closes (cancel path)
 *   - Body scroll lock while open (prevents background scroll behind modal)
 *
 * Purposefully NOT a portal — rendered inline so tests can find it via
 * screen.getByRole('dialog') without portal-teardown dance. Industries
 * can add a portal later if z-index issues arise.
 */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual treatment — 'danger' uses red confirm button for deletes. */
  variant?: 'danger' | 'default';
  /**
   * Slice 21 review I4 — return type widened to `void | Promise<void>`
   * so async confirm handlers can `await` mutations without their
   * rejections being silently swallowed by the dialog's `onClick`
   * synchronous discard. Callers should still own their own try/catch
   * for state cleanup (see BulkActionBar.handleDeleteConfirm), but
   * letting the promise propagate at least surfaces to the
   * unhandled-rejection channel.
   */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Escape key → cancel. Attach only when open so closed dialogs don't
  // eat Escape keys intended for other surfaces (e.g. Toast dismissal).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  // Focus the Cancel button on open — destructive actions should never
  // be a single keystroke away when the user just hit Enter to open.
  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      data-testid="confirm-dialog-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              // Slice 21 review I4 — onConfirm is widened to
              // `() => void | Promise<void>`. Wrap the call in a
              // .catch so a rejected promise is logged for diagnosis
              // but doesn't escape into Node's unhandled-rejection
              // channel. Callers (e.g. BulkActionBar.handleDeleteConfirm)
              // own their own try/finally for state cleanup; this
              // .catch is the dialog's last-ditch safety net.
              const result = onConfirm();
              if (result instanceof Promise) {
                result.catch((err) => {
                  // eslint-disable-next-line no-console
                  console.error('ConfirmDialog onConfirm rejected:', err);
                });
              }
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
