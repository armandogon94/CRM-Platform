// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionBar } from '../components/board/BulkActionBar';
import type { Board, Item } from '../types/index';

/**
 * BulkActionBar standalone-component contract tests (Slice 21C C1).
 *
 * The bar is a pure consumer of props — no `useBoard` import. It renders
 * iff `selectedIds.size > 0`. Action callbacks are RBAC-gated by the
 * parent: a callback that is `undefined` causes its button to be hidden
 * entirely (no greyed-out affordance hinting at a permission the user
 * doesn't have).
 *
 * The Status picker computes the UNION of options across selected items,
 * matching spec §Slice 21C OQ #1. Mixed-schema selections render every
 * unique option once.
 *
 * Wiring to TableView/BoardView is Phase D's concern; this file exercises
 * the bar's render + dispatch contract in isolation with mock callbacks.
 */

// ── Fixtures ────────────────────────────────────────────────────────────

const STATUS_COLUMN_ID = 5;

function makeBoard(
  options: Array<{ label: string; color: string }> = [
    { label: 'New', color: '#60A5FA' },
    { label: 'Done', color: '#34D399' },
  ]
): Board {
  return {
    id: 1,
    name: 'Pipeline',
    description: null,
    workspaceId: 1,
    boardType: 'main',
    groups: [],
    columns: [
      {
        id: STATUS_COLUMN_ID,
        boardId: 1,
        name: 'Status',
        columnType: 'status',
        config: { options },
        position: 0,
        width: 140,
        isRequired: false,
      },
    ],
    views: [],
  };
}

function makeItem(id: number, statusValue?: { label: string; color: string }): Item {
  return {
    id,
    boardId: 1,
    groupId: 1,
    name: `Item ${id}`,
    position: 0,
    createdBy: 1,
    columnValues: statusValue
      ? [{ id: id * 10, itemId: id, columnId: STATUS_COLUMN_ID, value: statusValue }]
      : [],
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('BulkActionBar', () => {
  // Typed mock factories — the prop callbacks are async, so we cast to the
  // exact prop signatures to keep `tsc --noEmit` clean. Vitest's default
  // `vi.fn()` returns `Mock<any[], unknown>`, which doesn't unify with
  // `Promise<void>` return types under strict mode.
  let onClear: () => void;
  let onBulkDelete: (ids: number[]) => Promise<void>;
  let onBulkUpdateStatus: (
    ids: number[],
    columnId: number,
    statusValue: { label: string; color: string }
  ) => Promise<void>;
  let onBulkAssign: (
    ids: number[],
    columnId: number,
    userIds: number[]
  ) => Promise<void>;

  beforeEach(() => {
    onClear = vi.fn();
    onBulkDelete = vi.fn().mockResolvedValue(undefined) as unknown as typeof onBulkDelete;
    onBulkUpdateStatus = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as typeof onBulkUpdateStatus;
    onBulkAssign = vi.fn().mockResolvedValue(undefined) as unknown as typeof onBulkAssign;
  });

  it('renders nothing when selectedIds is empty', () => {
    const { container } = render(
      <BulkActionBar
        selectedIds={new Set()}
        board={makeBoard()}
        items={[makeItem(10), makeItem(11)]}
        onClear={onClear}
        onBulkDelete={onBulkDelete}
        onBulkUpdateStatus={onBulkUpdateStatus}
        onBulkAssign={onBulkAssign}
      />
    );
    expect(container.querySelector('[data-testid="bulk-action-bar"]')).toBeNull();
    expect(screen.queryByText(/selected/i)).toBeNull();
  });

  it('renders "{N} selected" count and Clear control when selection is non-empty', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedIds={new Set([10, 11, 12])}
        board={makeBoard()}
        items={[makeItem(10), makeItem(11), makeItem(12)]}
        onClear={onClear}
        onBulkDelete={onBulkDelete}
      />
    );
    expect(screen.getByText(/3 selected/i)).toBeTruthy();

    const clearBtn = screen.getByRole('button', { name: /clear/i });
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Delete button opens ConfirmDialog with "Delete N items?"; confirm calls onBulkDelete then onClear; cancel does neither', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionBar
        selectedIds={new Set([10, 11, 12])}
        board={makeBoard()}
        items={[makeItem(10), makeItem(11), makeItem(12)]}
        onClear={onClear}
        onBulkDelete={onBulkDelete}
      />
    );

    // Cancel path first — dialog opens, cancel closes it, no callbacks fire.
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    let dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Delete 3 items?');
    expect(dialog.textContent).toContain('cannot be undone');

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onBulkDelete).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    // Confirm path — dialog reopens, confirm fires onBulkDelete with the ids,
    // then onClear runs after the awaited mutation resolves.
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    dialog = screen.getByRole('dialog');
    // The confirm button inside the dialog has confirmLabel="Delete" by
    // default since variant="danger" — find the dialog-scoped one.
    const confirmInDialog = dialog.querySelector('button.bg-red-600') as HTMLButtonElement | null;
    expect(confirmInDialog).toBeTruthy();
    await user.click(confirmInDialog!);

    expect(onBulkDelete).toHaveBeenCalledTimes(1);
    expect(onBulkDelete).toHaveBeenCalledWith([10, 11, 12]);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Change status dropdown shows the UNION of options across selected items (mixed-schema fixture)', async () => {
    const user = userEvent.setup();
    // Two items selected; their column values reference different option
    // sets. The bar's union logic is driven off `board.columns` config —
    // the spec answer to OQ #1 is to render every option from the status
    // column's config (the union of the workspace's option set), so the
    // mixed-fixture asserts all expected options are rendered.
    const board = makeBoard([
      { label: 'New', color: '#60A5FA' },
      { label: 'Done', color: '#34D399' },
      { label: 'Open', color: '#F59E0B' },
      { label: 'Closed', color: '#EF4444' },
    ]);
    render(
      <BulkActionBar
        selectedIds={new Set([10, 11])}
        board={board}
        items={[
          makeItem(10, { label: 'New', color: '#60A5FA' }),
          makeItem(11, { label: 'Open', color: '#F59E0B' }),
        ]}
        onClear={onClear}
        onBulkUpdateStatus={onBulkUpdateStatus}
      />
    );

    await user.click(screen.getByRole('button', { name: /change status/i }));

    // All four options visible in the picker.
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Done' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Open' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Closed' })).toBeTruthy();

    // Picking one option fires onBulkUpdateStatus with the right shape and clears.
    await user.click(screen.getByRole('menuitem', { name: 'Done' }));
    expect(onBulkUpdateStatus).toHaveBeenCalledTimes(1);
    expect(onBulkUpdateStatus).toHaveBeenCalledWith(
      [10, 11],
      STATUS_COLUMN_ID,
      { label: 'Done', color: '#34D399' }
    );
  });

  it('RBAC: when onBulkDelete is undefined, no Delete button renders; bar still shows count + Clear', () => {
    render(
      <BulkActionBar
        selectedIds={new Set([10])}
        board={makeBoard()}
        items={[makeItem(10)]}
        onClear={onClear}
        // no onBulkDelete, no onBulkUpdateStatus, no onBulkAssign
      />
    );
    expect(screen.getByText(/1 selected/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^delete$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /change status/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /assign/i })).toBeNull();
  });

  it('RBAC: each callback prop independently gates its button (only Delete shown when only onBulkDelete passed)', () => {
    render(
      <BulkActionBar
        selectedIds={new Set([10])}
        board={makeBoard()}
        items={[makeItem(10)]}
        onClear={onClear}
        onBulkDelete={onBulkDelete}
        // no onBulkUpdateStatus, no onBulkAssign
      />
    );
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /change status/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /assign/i })).toBeNull();
  });

  it('Slice 21 review I4: onClear still runs when onBulkDelete rejects (try/finally guard)', async () => {
    const user = userEvent.setup();
    // Pre-fix, handleDeleteConfirm awaited onBulkDelete and called
    // onClear() after — a rejection threw out of the function and
    // skipped the cleanup, leaving the bar mounted with a frozen
    // selection. The post-fix try/finally guarantees onClear runs
    // regardless of mutation outcome, so the user can recover by
    // clicking Clear or selecting a different row.
    const rejectingBulkDelete = vi.fn().mockRejectedValue(
      new Error('simulated network failure')
    );

    // Suppress the expected unhandled-rejection log so the test
    // output stays clean. (Widened ConfirmDialog onConfirm type
    // means the promise propagates; that's the intended behavior,
    // and it's React's job to surface it elsewhere.)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <BulkActionBar
          selectedIds={new Set([10, 11])}
          board={makeBoard()}
          items={[makeItem(10), makeItem(11)]}
          onClear={onClear}
          onBulkDelete={rejectingBulkDelete}
        />
      );

      await user.click(screen.getByRole('button', { name: /^delete$/i }));
      const dialog = screen.getByRole('dialog');
      const confirmInDialog = dialog.querySelector(
        'button.bg-red-600'
      ) as HTMLButtonElement | null;
      expect(confirmInDialog).toBeTruthy();
      await user.click(confirmInDialog!);

      // Allow the rejected promise + try/finally to settle.
      await Promise.resolve();
      await Promise.resolve();

      // The mutation was attempted...
      expect(rejectingBulkDelete).toHaveBeenCalledTimes(1);
      // ...and onClear ran despite the rejection — the load-bearing
      // assertion this test exists for.
      expect(onClear).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
