// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── child-view mocks — keep the BoardView wrapper test focused on the
// quota-indicator surface. The real children import heavy peers (e.g.
// react-leaflet for MapView) that don't need to render for header
// assertions. Each stub renders a stable testid so the routing
// behaviour remains observable downstream. ──
vi.mock('../components/board/TableView', () => ({
  TableView: () => <div data-testid="table-view-stub" />,
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
// Slice 21C D — BoardView now mounts BulkActionBar which itself
// imports lucide-react icons + ConfirmDialog. Stub it so quota tests
// stay focused on the header surface and don't pull the full bar tree.
vi.mock('../components/board/BulkActionBar', () => ({
  BulkActionBar: () => null,
}));

import { BoardView } from '../components/board/BoardView';
import type { Board, BoardView as BoardViewType, Item } from '../types/index';

/**
 * Slice 21A — Phase C2: BoardView quota indicator.
 *
 * The header gains a thin progress bar driven by the workspace's
 * storageUsed/storageLimit. Color thresholds (green <70%, yellow 70-90%,
 * red >90%) are surfaced via a `data-color` attribute so the test reads
 * the contract without hard-coding tailwind class strings.
 *
 * The bar is hidden when the workspace doesn't expose a limit
 * (storageLimit === 0 or undefined) — defensive against legacy payloads
 * that haven't surfaced the field yet, and avoids a divide-by-zero in
 * the percentage calc.
 */

// ── workspace mock — drives the indicator's threshold/visibility ─────
const mockUseWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => mockUseWorkspace(),
}));

// ── auth mock — Slice 21C D added useCanEdit() inside BoardView so the
// component reads useAuth() at render time. Quota tests don't care
// about role; stub a viewer to keep affordances off and avoid pulling
// the real AuthProvider.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

function setStorage(used: number | undefined, limit: number | undefined) {
  mockUseWorkspace.mockReturnValue({
    workspace: {
      id: 1,
      name: 'WS',
      slug: 'ws',
      description: null,
      storageUsed: used,
      storageLimit: limit,
    },
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn(),
    isLoading: false,
  });
}

// Minimal board fixture — we only care about the wrapper / header, not
// the inner view. A table view with empty items renders quickly and
// without errors.
const TABLE_VIEW: BoardViewType = {
  id: 1,
  boardId: 1,
  name: 'Default',
  viewType: 'table',
  settings: {},
  layoutJson: null,
  isDefault: true,
};

const BOARD: Board = {
  id: 1,
  name: 'Test',
  description: null,
  workspaceId: 1,
  boardType: 'main',
  groups: [],
  columns: [],
  views: [TABLE_VIEW],
};

const ITEMS: Item[] = [];

const MB = 1024 * 1024;

describe('BoardView quota indicator (Slice 21A C2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders green when usage < 70%', () => {
    // 50MB / 100MB = 50% → green threshold
    setStorage(50 * MB, 100 * MB);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    const indicator = screen.getByTestId('quota-indicator');
    expect(indicator.getAttribute('data-color')).toBe('green');
  });

  it('renders yellow when usage is between 70% and 90%', () => {
    // 80MB / 100MB = 80% → yellow threshold
    setStorage(80 * MB, 100 * MB);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    const indicator = screen.getByTestId('quota-indicator');
    expect(indicator.getAttribute('data-color')).toBe('yellow');
  });

  it('renders red when usage > 90%', () => {
    // 95MB / 100MB = 95% → red threshold
    setStorage(95 * MB, 100 * MB);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    const indicator = screen.getByTestId('quota-indicator');
    expect(indicator.getAttribute('data-color')).toBe('red');
  });

  it('hides the indicator when storageLimit is 0', () => {
    setStorage(0, 0);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    expect(screen.queryByTestId('quota-indicator')).toBeNull();
  });

  it('hides the indicator when storageLimit is undefined', () => {
    setStorage(undefined, undefined);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    expect(screen.queryByTestId('quota-indicator')).toBeNull();
  });

  it('formats the text as "X MB / Y MB" rounded to 1 decimal', () => {
    // 12.5MB / 100MB → "12.5 MB / 100.0 MB"
    setStorage(12.5 * MB, 100 * MB);
    render(<BoardView board={BOARD} items={ITEMS} currentView={TABLE_VIEW} />);

    expect(screen.getByText(/12\.5 MB \/ 100\.0 MB/)).toBeTruthy();
  });
});
