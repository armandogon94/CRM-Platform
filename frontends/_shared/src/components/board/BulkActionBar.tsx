import { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronDown, Users, X } from 'lucide-react';
import type { Board, Column, Item } from '../../types/index';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * BulkActionBar — Slice 21C C1 (standalone component, not yet wired).
 *
 * Pure consumer of props: no `useBoard` import. Mutation callbacks come
 * from the parent (`<BoardView>`) and are RBAC-gated there — a `undefined`
 * callback hides its button entirely (no greyed-out affordance hinting at
 * a permission the user doesn't have).
 *
 * Status picker shows the union of options across the workspace's status
 * column config (per spec OQ #1) — items whose current value isn't in the
 * union are still selectable; the per-item update route handles validation.
 *
 * Phase D will mount this next to `<TableView>` and pass real callbacks.
 * Phase E will integrate the 21B PersonPicker for the Assign action; for
 * now Assign is a disabled placeholder so the UX surface is visible.
 */

export interface BulkActionBarProps {
  selectedIds: Set<number>;
  board: Board;
  /**
   * The currently visible items. Used to compute the union of status
   * options when those need to be derived from item-level data; the
   * primary union source is `board.columns.find(c => c.columnType === 'status').config.options`.
   */
  items: Item[];
  onClear: () => void;
  // Mutations — parent decides which to pass based on RBAC. Buttons whose
  // mutation prop is `undefined` are not rendered (see test #6).
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onBulkUpdateStatus?: (
    ids: number[],
    columnId: number,
    statusValue: { label: string; color: string }
  ) => Promise<void>;
  onBulkAssign?: (
    ids: number[],
    columnId: number,
    userIds: number[]
  ) => Promise<void>;
}

interface StatusOption {
  label: string;
  color: string;
}

/**
 * Compute the union of status options across the selected items + the
 * board's status column config. Per spec OQ #1, the bar is permitted to
 * apply any option from the workspace's option set; we additionally
 * dedupe-by-label so heterogeneous fixtures (item-A options vs item-B
 * options) collapse to a single button per unique label.
 */
function computeStatusOptionUnion(
  board: Board,
  items: Item[],
  selectedIds: Set<number>
): { column: Column | undefined; options: StatusOption[] } {
  const column = board.columns?.find((c) => c.columnType === 'status');
  if (!column) return { column: undefined, options: [] };

  const seen = new Map<string, StatusOption>();

  // Primary source: the column's config.options (the workspace's canonical
  // list). This is the spec-blessed union.
  const configOptions =
    (column.config as { options?: StatusOption[] })?.options || [];
  for (const opt of configOptions) {
    if (opt && typeof opt.label === 'string' && !seen.has(opt.label)) {
      seen.set(opt.label, { label: opt.label, color: opt.color || '#6B7280' });
    }
  }

  // Secondary source: any selected item carrying an option not in the
  // config (e.g. legacy seed values). Surface them so the user can still
  // re-select / overwrite that value across the selection.
  for (const item of items) {
    if (!selectedIds.has(item.id)) continue;
    const cv = item.columnValues?.find((v) => v.columnId === column.id);
    const raw = cv?.value as { label?: string; color?: string } | undefined;
    if (raw && typeof raw.label === 'string' && !seen.has(raw.label)) {
      seen.set(raw.label, {
        label: raw.label,
        color: typeof raw.color === 'string' ? raw.color : '#6B7280',
      });
    }
  }

  return { column, options: Array.from(seen.values()) };
}

export function BulkActionBar({
  selectedIds,
  board,
  items,
  onClear,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkAssign,
}: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  // Close the status picker on outside click — keeps the bar lean and
  // avoids shipping a full dropdown library for one menu.
  useEffect(() => {
    if (!statusPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        statusPickerRef.current &&
        !statusPickerRef.current.contains(e.target as Node)
      ) {
        setStatusPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusPickerOpen]);

  // Don't render at all when there's no selection — the bar is a focused
  // affordance, not a persistent toolbar.
  if (selectedIds.size === 0) {
    return null;
  }

  const ids = Array.from(selectedIds);
  const { column: statusColumn, options: statusOptions } =
    computeStatusOptionUnion(board, items, selectedIds);

  async function handleDeleteConfirm() {
    if (!onBulkDelete) return;
    setConfirmOpen(false);
    // Slice 21 review I4 — onBulkDelete CAN reject (per-item failures
    // bubble up through useBoard.bulkDelete's Promise.allSettled
    // aggregator only when the wrapper itself throws, but a future
    // refactor or transient network error could surface a rejection
    // here). Without try/finally, a thrown error would leave selection
    // frozen forever (the bar stays mounted, blocking further input).
    // The dialog's onConfirm widened type means the promise propagates
    // to React's unhandled-rejection channel, so silent swallow is now
    // impossible — but UI cleanup still has to happen here.
    try {
      await onBulkDelete(ids);
    } finally {
      onClear();
    }
  }

  async function handleStatusPick(opt: StatusOption) {
    if (!onBulkUpdateStatus || !statusColumn) return;
    setStatusPickerOpen(false);
    // Same I4 rationale as handleDeleteConfirm — onClear must run
    // even if the bulk update rejects, so the user isn't stuck with
    // a frozen selection.
    try {
      await onBulkUpdateStatus(ids, statusColumn.id, opt);
    } finally {
      onClear();
    }
  }

  return (
    <>
      <div
        data-testid="bulk-action-bar"
        role="toolbar"
        aria-label="Bulk actions"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white rounded-lg shadow-xl px-4 py-2.5"
      >
        {/* Left — selection count + Clear */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-gray-300 hover:text-white underline-offset-2 hover:underline"
            aria-label="Clear selection"
          >
            Clear
          </button>
        </div>

        {/* Center — action buttons (RBAC-gated by parent) */}
        {(onBulkDelete || onBulkUpdateStatus || onBulkAssign) && (
          <div className="h-5 w-px bg-gray-700" aria-hidden="true" />
        )}
        <div className="flex items-center gap-1">
          {onBulkDelete && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete
            </button>
          )}

          {onBulkUpdateStatus && statusColumn && statusOptions.length > 0 && (
            <div ref={statusPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusPickerOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={statusPickerOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              >
                Change status
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              {statusPickerOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full mb-2 left-0 min-w-[12rem] bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black/5 py-1"
                >
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      role="menuitem"
                      onClick={() => handleStatusPick(opt)}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: opt.color }}
                        aria-hidden="true"
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onBulkAssign && (
            // Phase C placeholder: real PersonPicker integration lands in
            // Phase D/E once 21B's picker is wired into BoardView. Disabled
            // here so the surface area is visible without forcing a
            // premature 21B import.
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded text-gray-400 cursor-not-allowed"
              aria-disabled="true"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              Assign
            </button>
          )}
        </div>

        {/* Right — close affordance, mirrors the Clear link for users who
            reach for an X icon (Linear / Notion convention). */}
        <button
          type="button"
          onClick={onClear}
          aria-label="Dismiss bulk action bar"
          className="ml-1 p-1 rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}?`}
        description="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
