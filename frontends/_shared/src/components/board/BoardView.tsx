import React, { useCallback, useState } from 'react';
import type { Board, Item, BoardView as BoardViewType } from '../../types/index';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { ChartView } from './ChartView';
import { FormView } from './FormView';
import { DashboardView } from './DashboardView';
import { MapView } from './MapView';
import { BulkActionBar } from './BulkActionBar';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useCanEdit } from '../../hooks/useCanEdit';

interface BoardViewProps {
  board: Board;
  items: Item[];
  currentView: BoardViewType;
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
  /**
   * Slice 21C D — bulk mutation handlers. Mirror the per-item callback
   * pattern (`onItemUpdate` etc.); the consumer (industry BoardPage)
   * wires these from `useBoard().bulkDelete / bulkUpdateValue /
   * bulkAssign` (Phase A1). BoardView passes them through to
   * BulkActionBar conditional on the `useCanEdit()` matrix so a viewer
   * never sees CRUD affordances even if the parent passes the
   * callbacks (defense in depth — the backend's 403 path is still
   * authoritative).
   *
   * Naming follows the bar's prop contract (Phase C1):
   *   onBulkDelete       — gated by canDelete
   *   onBulkUpdateValue  — gated by canEditInline (status picker)
   *   onBulkAssign       — gated by canEditInline (person picker, Phase E)
   */
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onBulkUpdateValue?: (
    ids: number[],
    columnId: number,
    value: { label: string; color: string }
  ) => Promise<void>;
  onBulkAssign?: (
    ids: number[],
    columnId: number,
    userIds: number[]
  ) => Promise<void>;
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

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  items,
  currentView,
  onItemUpdate,
  onItemCreate,
  onItemDelete,
  onBulkDelete,
  onBulkUpdateValue,
  onBulkAssign,
}) => {
  // Slice 21C D — selection mirror + clear token. Selection state still
  // lives in TableView (D1a); BoardView keeps a parallel copy purely so
  // BulkActionBar has something to render against. The token bumps
  // every Clear / Dismiss so TableView's internal selection resets in
  // lock-step with the bar's disappearance.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [clearToken, setClearToken] = useState(0);

  const canEdit = useCanEdit();

  const isTableView = currentView.viewType === 'table';

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setClearToken((t) => t + 1);
  }, []);

  // RBAC-gated handler set — `undefined` means BulkActionBar hides the
  // corresponding button entirely (verified in C1 test #6). We avoid
  // returning a stub that throws because the bar's affordance contract
  // is "presence implies permission."
  const gatedBulkDelete = canEdit.canDelete ? onBulkDelete : undefined;
  const gatedBulkUpdateStatus = canEdit.canEditInline
    ? onBulkUpdateValue
    : undefined;
  const gatedBulkAssign = canEdit.canEditInline ? onBulkAssign : undefined;

  // Render the active view. We inline this (instead of the pre-21D
  // helper) so TableView gets the selection-mirror props directly —
  // pulling them through a function arg would just re-thread the same
  // four references with no clarity benefit.
  let viewElement: React.ReactElement;
  switch (currentView.viewType) {
    case 'table':
      viewElement = (
        <TableView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
          onSelectionChange={setSelectedIds}
          clearSelectionToken={clearToken}
        />
      );
      break;
    case 'kanban':
      viewElement = (
        <KanbanView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      );
      break;
    case 'calendar':
      viewElement = <CalendarView board={board} items={items} />;
      break;
    case 'timeline':
      viewElement = <TimelineView board={board} items={items} />;
      break;
    case 'chart':
      viewElement = <ChartView board={board} items={items} />;
      break;
    case 'form':
      viewElement = (
        <FormView
          board={board}
          onSubmit={(name, _values) => {
            onItemCreate?.(board.groups[0]?.id || 0, name);
          }}
        />
      );
      break;
    case 'dashboard':
      viewElement = <DashboardView board={board} />;
      break;
    case 'map':
      viewElement = <MapView board={board} items={items} />;
      break;
    default:
      viewElement = (
        <TableView
          board={board}
          items={items}
          onItemUpdate={onItemUpdate}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
          onSelectionChange={setSelectedIds}
          clearSelectionToken={clearToken}
        />
      );
  }

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
      {viewElement}
      {/* BulkActionBar is TableView-only this slice. Other views are
          single-item-focused (Kanban drag, Calendar event drag, etc.)
          and don't expose a multi-select surface. The bar self-hides
          when selection is empty (C1) so this stays cheap on a fresh
          load. */}
      {isTableView && (
        <BulkActionBar
          selectedIds={selectedIds}
          board={board}
          items={items}
          onClear={handleClearSelection}
          onBulkDelete={gatedBulkDelete}
          onBulkUpdateStatus={gatedBulkUpdateStatus}
          onBulkAssign={gatedBulkAssign}
        />
      )}
    </>
  );
};

export default BoardView;
