import React from 'react';
import type { Board, Item, BoardView as BoardViewType } from '../../types/index';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { ChartView } from './ChartView';
import { FormView } from './FormView';
import { DashboardView } from './DashboardView';
import { MapView } from './MapView';
import { useWorkspace } from '../../context/WorkspaceContext';

interface BoardViewProps {
  board: Board;
  items: Item[];
  currentView: BoardViewType;
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}

/**
 * Slice 21A C2 — workspace storage quota indicator.
 *
 * Renders a thin progress bar in the BoardView header reflecting
 * `workspace.storageUsed / workspace.storageLimit`. Color thresholds
 * surface via `data-color`:
 *   - green   < 70%
 *   - yellow  70–90%
 *   - red     > 90%
 *
 * Hidden when `storageLimit` is 0 / undefined — defensive: legacy
 * workspace payloads may not carry the field, and zero would
 * divide-by-zero the percent calc.
 *
 * Read-only for all roles; quota is a workspace-wide signal, not a
 * write affordance, so viewer-role gating doesn't apply.
 */
const BYTES_PER_MB = 1024 * 1024;

function QuotaIndicator(): React.ReactElement | null {
  const { workspace } = useWorkspace();
  const used = workspace?.storageUsed;
  const limit = workspace?.storageLimit;

  // Defensive guards — both fields must be present and limit must be
  // positive. Without this the bar would render at NaN% and crash the
  // text formatter on `undefined / 1024 / 1024`.
  if (used === undefined || limit === undefined || limit <= 0) {
    return null;
  }

  const percent = Math.min(100, (used / limit) * 100);
  const color: 'green' | 'yellow' | 'red' =
    percent > 90 ? 'red' : percent >= 70 ? 'yellow' : 'green';

  // 1-decimal MB formatting matches the spec — keeps the header readable
  // without exposing fractional-byte noise.
  const usedMb = (used / BYTES_PER_MB).toFixed(1);
  const limitMb = (limit / BYTES_PER_MB).toFixed(1);

  const fillClass =
    color === 'red'
      ? 'bg-red-500'
      : color === 'yellow'
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div
      data-testid="quota-indicator"
      data-color={color}
      className="flex items-center gap-2 text-xs text-gray-600"
      aria-label="Workspace storage usage"
    >
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          className={`h-full transition-all ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span>
        {usedMb} MB / {limitMb} MB
      </span>
    </div>
  );
}

function renderView(
  board: Board,
  items: Item[],
  currentView: BoardViewType,
  onItemUpdate?: BoardViewProps['onItemUpdate'],
  onItemCreate?: BoardViewProps['onItemCreate'],
  onItemDelete?: BoardViewProps['onItemDelete']
): React.ReactElement {
  switch (currentView.viewType) {
    case 'table':
      return (
        <TableView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
    case 'kanban':
      return (
        <KanbanView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
    case 'calendar':
      return <CalendarView board={board} items={items} />;
    case 'timeline':
      return <TimelineView board={board} items={items} />;
    case 'chart':
      return <ChartView board={board} items={items} />;
    case 'form':
      return (
        <FormView
          board={board}
          onSubmit={(name, _values) => {
            onItemCreate?.(board.groups[0]?.id || 0, name);
          }}
        />
      );
    case 'dashboard':
      return <DashboardView board={board} />;
    case 'map':
      return <MapView board={board} items={items} />;
    default:
      return (
        <TableView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
  }
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  items,
  currentView,
  onItemUpdate,
  onItemCreate,
  onItemDelete,
}) => {
  return (
    <>
      {/* Header strip — currently only the quota indicator. Kept thin
          so the existing view chrome (toolbars rendered by parent
          components like BoardPage) remains visually dominant. The
          fragment-only render path means a workspace without quota
          set produces zero header markup, identical to pre-21A. */}
      <div
        data-testid="board-view-header"
        className="flex items-center justify-end px-3 py-1"
      >
        <QuotaIndicator />
      </div>
      {renderView(board, items, currentView, onItemUpdate, onItemCreate, onItemDelete)}
    </>
  );
};

export default BoardView;
