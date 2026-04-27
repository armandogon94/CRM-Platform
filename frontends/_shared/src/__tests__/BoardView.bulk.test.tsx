// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Slice 21C — Phase D: BoardView wires BulkActionBar to TableView's
 * lifted selection.
 *
 * The wrapper now mirrors `selectedIds` via TableView's
 * `onSelectionChange` callback (D1a) and forwards a `clearSelectionToken`
 * the other direction so the bar's Clear / Dismiss can reach back into
 * TableView. RBAC gating happens in BoardView via `useCanEdit()`: a
 * mutation prop is only forwarded to BulkActionBar when the role allows
 * the corresponding action — undefined-prop branches in BulkActionBar
 * already hide the buttons (verified in the C1 test), so admin and
 * viewer get distinct affordance sets without conditional render in the
 * bar itself.
 *
 * BulkActionBar is mounted only when the current view is `table` —
 * Kanban / Calendar / etc. don't expose a multi-select surface this
 * slice. We rely on a stubbed BulkActionBar so the mounting test
 * doesn't need to drive the real component's confirm dialog or status
 * picker (those are exercised in BulkActionBar.test.tsx).
 */

// ── child-view mocks. TableView is special: we drive its
// onSelectionChange / clearSelectionToken contract directly so the test
// can observe the wiring without rendering full row markup. ──
interface TableViewMockProps {
  onSelectionChange?: (s: Set<number>) => void;
  clearSelectionToken?: number;
}
const tableViewSpy = vi.fn<[TableViewMockProps], void>();
let tableViewSelectionEmitter: ((s: Set<number>) => void) | null = null;

vi.mock('../components/board/TableView', () => ({
  TableView: (props: TableViewMockProps) => {
    tableViewSpy(props);
    // Capture the callback so the test can fire it later, simulating a
    // row click without rendering the real row DOM.
    tableViewSelectionEmitter = props.onSelectionChange ?? null;
    return (
      <div
        data-testid="table-view-stub"
        data-clear-token={String(props.clearSelectionToken ?? '')}
      />
    );
  },
}));
vi.mock('../components/board/KanbanView', () => ({
  KanbanView: () => <div data-testid="kanban-view-stub" />,
}));
vi.mock('../components/board/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view-stub" />,
}));
vi.mock('../components/board/TimelineView', () => ({
  TimelineView: () => <div data-testid="timeline-view-stub" />,
}));
vi.mock('../components/board/ChartView', () => ({
  ChartView: () => <div data-testid="chart-view-stub" />,
}));
vi.mock('../components/board/FormView', () => ({
  FormView: () => <div data-testid="form-view-stub" />,
}));
vi.mock('../components/board/DashboardView', () => ({
  DashboardView: () => <div data-testid="dashboard-view-stub" />,
}));
vi.mock('../components/board/MapView', () => ({
  MapView: () => <div data-testid="map-view-stub" />,
}));

// ── BulkActionBar stub — capture props so the test can assert on what
// BoardView passed (RBAC gating, ids, callbacks). The real bar's
// rendering is covered by BulkActionBar.test.tsx (C1). ──
interface BulkActionBarStubProps {
  selectedIds: Set<number>;
  onClear: () => void;
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
const bulkActionBarSpy = vi.fn<[BulkActionBarStubProps], void>();
let lastBulkClear: (() => void) | null = null;

vi.mock('../components/board/BulkActionBar', () => ({
  BulkActionBar: (props: BulkActionBarStubProps) => {
    bulkActionBarSpy(props);
    lastBulkClear = props.onClear;
    if (props.selectedIds.size === 0) return null;
    return (
      <div
        data-testid="bulk-action-bar-stub"
        data-selected-count={String(props.selectedIds.size)}
        data-has-delete={props.onBulkDelete ? 'true' : 'false'}
        data-has-status={props.onBulkUpdateStatus ? 'true' : 'false'}
        data-has-assign={props.onBulkAssign ? 'true' : 'false'}
      />
    );
  },
}));

// ── workspace + auth context mocks (BoardView reads workspace for
// quota; BulkActionBar wiring reads auth via useCanEdit). ──
const mockUseWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => mockUseWorkspace(),
}));

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { BoardView } from '../components/board/BoardView';
import type {
  Board,
  BoardView as BoardViewType,
  Item,
  User,
} from '../types/index';

function setRole(role: User['role'] | null) {
  mockUseAuth.mockReturnValue({
    user: role
      ? {
          id: 1,
          email: 'admin@x.com',
          firstName: 'A',
          lastName: 'B',
          avatar: null,
          role,
          workspaceId: 1,
        }
      : null,
    accessToken: role ? 'tok' : null,
    isAuthenticated: !!role,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  tableViewSelectionEmitter = null;
  lastBulkClear = null;
  // No quota by default — keeps the indicator out of the way for these
  // bulk-wiring tests.
  mockUseWorkspace.mockReturnValue({
    workspace: { id: 1, name: 'WS', slug: 'ws', description: null },
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn(),
    isLoading: false,
  });
});

const TABLE_VIEW: BoardViewType = {
  id: 1,
  boardId: 1,
  name: 'Default',
  viewType: 'table',
  settings: {},
  layoutJson: null,
  isDefault: true,
};

const KANBAN_VIEW: BoardViewType = {
  id: 2,
  boardId: 1,
  name: 'Kanban',
  viewType: 'kanban',
  settings: {},
  layoutJson: null,
  isDefault: false,
};

const BOARD: Board = {
  id: 1,
  name: 'Test',
  description: null,
  workspaceId: 1,
  boardType: 'main',
  groups: [],
  columns: [],
  views: [TABLE_VIEW, KANBAN_VIEW],
};

const ITEMS: Item[] = [];

describe('BoardView — BulkActionBar wiring (Slice 21C D1b)', () => {
  it('does NOT mount BulkActionBar when selection is empty', () => {
    setRole('admin');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    // Bar stub returns null at size === 0; no testid in the DOM.
    expect(screen.queryByTestId('bulk-action-bar-stub')).toBeNull();
    // ...but the component still ran so the props can be inspected: the
    // last call has empty selection.
    const lastCall = bulkActionBarSpy.mock.calls[
      bulkActionBarSpy.mock.calls.length - 1
    ][0];
    expect(lastCall.selectedIds.size).toBe(0);
  });

  it('mounts BulkActionBar when TableView reports a non-empty selection', async () => {
    setRole('admin');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    // Simulate TableView reporting a selection upstream — BoardView
    // mirrors via the same Set. The stub bar then becomes visible.
    expect(tableViewSelectionEmitter).not.toBeNull();
    await act(async () => {
      tableViewSelectionEmitter!(new Set([10, 11, 12]));
    });

    const bar = screen.getByTestId('bulk-action-bar-stub');
    expect(bar.getAttribute('data-selected-count')).toBe('3');
  });

  it('passes RBAC-gated mutations: admin gets all three handlers', async () => {
    setRole('admin');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    await act(async () => {
      tableViewSelectionEmitter!(new Set([10]));
    });

    const bar = screen.getByTestId('bulk-action-bar-stub');
    expect(bar.getAttribute('data-has-delete')).toBe('true');
    expect(bar.getAttribute('data-has-status')).toBe('true');
    expect(bar.getAttribute('data-has-assign')).toBe('true');
  });

  it('viewer sees the bar without any mutation handlers (RBAC matrix)', async () => {
    setRole('viewer');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    await act(async () => {
      tableViewSelectionEmitter!(new Set([10]));
    });

    const bar = screen.getByTestId('bulk-action-bar-stub');
    // BulkActionBar still mounts (the count badge is informative, not a
    // CRUD affordance), but every mutation handler is undefined so the
    // C1 contract hides the action buttons.
    expect(bar.getAttribute('data-has-delete')).toBe('false');
    expect(bar.getAttribute('data-has-status')).toBe('false');
    expect(bar.getAttribute('data-has-assign')).toBe('false');
  });

  it('member: no canCreateBoard but canDelete/canEditInline = true → all bulk handlers wired', async () => {
    setRole('member');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    await act(async () => {
      tableViewSelectionEmitter!(new Set([10, 11]));
    });

    const bar = screen.getByTestId('bulk-action-bar-stub');
    expect(bar.getAttribute('data-has-delete')).toBe('true');
    expect(bar.getAttribute('data-has-status')).toBe('true');
    expect(bar.getAttribute('data-has-assign')).toBe('true');
  });

  it('does NOT mount BulkActionBar when current view is not Table (Kanban)', async () => {
    setRole('admin');
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={KANBAN_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    // The Kanban stub renders but no bulk bar exists, regardless of
    // selection state — the bar is TableView-only this slice.
    expect(screen.getByTestId('kanban-view-stub')).toBeTruthy();
    expect(screen.queryByTestId('bulk-action-bar-stub')).toBeNull();
    // The TableView mock didn't render either, so the emitter is null:
    // no way to push a fake selection. That's the point — non-Table
    // views never wire the selection mirror at all.
    expect(tableViewSelectionEmitter).toBeNull();
  });

  it('onClear from BulkActionBar resets the mirrored selection AND bumps the clear token to TableView', async () => {
    setRole('admin');
    const user = userEvent.setup();
    void user; // satisfy unused-warning if userEvent isn't needed
    render(
      <BoardView
        board={BOARD}
        items={ITEMS}
        currentView={TABLE_VIEW}
        onBulkDelete={vi.fn()}
        onBulkUpdateValue={vi.fn()}
        onBulkAssign={vi.fn()}
      />
    );

    await act(async () => {
      tableViewSelectionEmitter!(new Set([10, 11, 12]));
    });

    // Read the token TableView received before clear.
    const tableStub = screen.getByTestId('table-view-stub');
    const tokenBefore = tableStub.getAttribute('data-clear-token');

    // Fire the bar's onClear callback (what the user does via Clear /
    // Dismiss buttons in the real component).
    expect(lastBulkClear).not.toBeNull();
    await act(async () => {
      lastBulkClear!();
    });

    // BulkActionBar disappears (selection is back to empty).
    expect(screen.queryByTestId('bulk-action-bar-stub')).toBeNull();

    // TableView receives a fresh token so its internal selection clears
    // alongside the mirror. The exact value isn't asserted (it's an
    // opaque counter) — only that it changed.
    const tokenAfter = screen
      .getByTestId('table-view-stub')
      .getAttribute('data-clear-token');
    expect(tokenAfter).not.toBe(tokenBefore);
  });
});
