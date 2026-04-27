import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Type,
  Hash,
  Calendar,
  User,
  Mail,
  Phone,
  Link,
  CheckSquare,
  List,
  Star,
  FileText,
  Clock,
  Paperclip,
  Calculator,
  AlignLeft,
} from 'lucide-react';
import type { Board, BoardGroup, Column, Item, ColumnValue } from '../../types/index';
import { ColumnRenderer } from './ColumnRenderer';
import { ColumnEditor } from './ColumnEditor';

interface TableViewProps {
  board: Board;
  items: Item[];
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
  /**
   * Optional opaque signal that changes when the parent's filter/search
   * input changes. When this value changes, TableView clears its
   * selection per ADR 21C-3 ("filter clears, sort preserves"). Sort
   * changes should NOT alter `filterKey` — only filter/search inputs.
   * Phase D (BoardView wiring) will pass this; Phase B leaves it
   * optional so existing callers compile unchanged.
   */
  filterKey?: string | number;
  /**
   * Phase D — selection mirror. Fires whenever the internal selection
   * changes (including the initial empty Set on mount), so BoardView
   * can render `<BulkActionBar>` against the same id set without
   * reaching into TableView's state.
   *
   * TableView retains ownership of the selection — this is a one-way
   * notifier, not a controlled-component handoff. Keeping ownership
   * inside TableView means the click matrix, filter-clear, and Escape
   * handlers (B1) stay self-contained and don't grow controlled-prop
   * branches.
   */
  onSelectionChange?: (selectedIds: Set<number>) => void;
  /**
   * Phase D — imperative clear via token bump. When this value
   * *changes*, TableView resets its selection + lastClickedId. The
   * stable-value path is a no-op so a parent that always passes `0`
   * doesn't wipe selection on every re-render. BulkActionBar's Clear
   * / Dismiss callbacks bump this from BoardView to mirror.
   */
  clearSelectionToken?: number;
}

const columnTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  long_text: AlignLeft,
  number: Hash,
  date: Calendar,
  person: User,
  email: Mail,
  phone: Phone,
  url: Link,
  checkbox: CheckSquare,
  status: List,
  dropdown: List,
  rating: Star,
  files: Paperclip,
  formula: Calculator,
  timeline: Clock,
};

function getValueForColumn(item: Item, columnId: number): any {
  const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === columnId);
  return cv?.value ?? null;
}

interface EditingCell {
  itemId: number;
  columnId: number;
}

type ClickModifiers = {
  shift: boolean;
  meta: boolean; // Cmd on macOS, Ctrl on others
};

/**
 * Pure selection reducer per SPEC §Slice 21C click matrix.
 *
 * - Bare click: replace selection with [clickedId]; lastClickedId = clickedId.
 * - Cmd/Ctrl+click: toggle clickedId in/out of set; lastClickedId = clickedId.
 * - Shift+click: range from lastClickedId..clickedId (inclusive) against
 *   the current visible-id order; ADDS to existing selection.
 *   If lastClickedId is null, behaves like a bare click.
 *
 * `visibleIds` is the rendered item-id order (post-filter, post-sort,
 * post-group), so the Shift range matches what the user sees.
 */
export function computeNextSelection(
  prev: Set<number>,
  clickedId: number,
  modifiers: ClickModifiers,
  lastClickedId: number | null,
  visibleIds: number[]
): { next: Set<number>; nextLastClickedId: number } {
  if (modifiers.shift && lastClickedId !== null) {
    const startIdx = visibleIds.indexOf(lastClickedId);
    const endIdx = visibleIds.indexOf(clickedId);
    if (startIdx !== -1 && endIdx !== -1) {
      const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const next = new Set(prev);
      for (let i = from; i <= to; i++) {
        next.add(visibleIds[i]);
      }
      // Shift extends but does NOT re-anchor lastClickedId per spec
      return { next, nextLastClickedId: lastClickedId };
    }
  }

  if (modifiers.meta) {
    const next = new Set(prev);
    if (next.has(clickedId)) {
      next.delete(clickedId);
    } else {
      next.add(clickedId);
    }
    return { next, nextLastClickedId: clickedId };
  }

  // Bare click — replace
  return { next: new Set([clickedId]), nextLastClickedId: clickedId };
}

function GroupSection({
  group,
  columns,
  items,
  editingCell,
  selectedIds,
  onRowClick,
  onCheckboxClick,
  onHeaderToggle,
  onCellClick,
  onCellChange,
  onCellBlur,
  onItemCreate,
}: {
  group: BoardGroup;
  columns: Column[];
  items: Item[];
  editingCell: EditingCell | null;
  selectedIds: Set<number>;
  onRowClick: (itemId: number, e: React.MouseEvent) => void;
  onCheckboxClick: (itemId: number, e: React.MouseEvent) => void;
  onHeaderToggle: (groupItemIds: number[]) => void;
  onCellClick: (itemId: number, columnId: number) => void;
  onCellChange: (itemId: number, columnId: number, value: any) => void;
  onCellBlur: () => void;
  onItemCreate?: (groupId: number, name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const groupItems = items.filter((i) => i.groupId === group.id);
  const groupItemIds = groupItems.map((i) => i.id);
  const allSelected =
    groupItemIds.length > 0 && groupItemIds.every((id) => selectedIds.has(id));

  function handleAddItem() {
    if (!newItemName.trim() || !onItemCreate) return;
    onItemCreate(group.id, newItemName.trim());
    setNewItemName('');
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors w-full group"
      >
        {collapsed ? (
          <ChevronRight size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span className="font-semibold text-sm" style={{ color: group.color }}>
          {group.name}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
        </span>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto ml-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th
                  className="py-2 px-3 text-xs font-medium text-gray-500 bg-gray-50 sticky left-0 z-10 border-b border-gray-200 w-10"
                  style={{ borderLeft: `3px solid ${group.color}` }}
                >
                  <input
                    type="checkbox"
                    data-testid="header-checkbox"
                    aria-label={`Select all visible items in ${group.name}`}
                    checked={allSelected}
                    onChange={() => onHeaderToggle(groupItemIds)}
                    className="cursor-pointer"
                  />
                </th>
                <th
                  className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-10 z-10 min-w-[220px] border-b border-gray-200"
                >
                  Item
                </th>
                {columns.map((col) => {
                  const Icon = columnTypeIcons[col.columnType] || FileText;
                  return (
                    <th
                      key={col.id}
                      className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 whitespace-nowrap"
                      style={{ minWidth: col.width || 140 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-gray-400" />
                        {col.name}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    data-testid={`row-${item.id}`}
                    data-selected={isSelected ? 'true' : 'false'}
                    onClick={(e) => onRowClick(item.id, e)}
                    className={`border-b border-gray-100 transition-colors group/row ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-blue-50/30'
                    }`}
                  >
                    <td
                      className="py-2.5 px-3 bg-white sticky left-0 z-10 group-hover/row:bg-blue-50/30 w-10"
                      style={{ borderLeft: `3px solid ${group.color}` }}
                    >
                      <input
                        type="checkbox"
                        data-testid={`row-checkbox-${item.id}`}
                        aria-label={`Select ${item.name}`}
                        checked={isSelected}
                        onChange={() => {
                          /* state owned by row click handler */
                        }}
                        onClick={(e) => onCheckboxClick(item.id, e)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td
                      className="py-2.5 px-3 text-sm font-medium text-gray-900 bg-white sticky left-10 z-10 group-hover/row:bg-blue-50/30"
                    >
                      {item.name}
                    </td>
                    {columns.map((col) => {
                      const isEditing =
                        editingCell?.itemId === item.id && editingCell?.columnId === col.id;
                      const cellValue = getValueForColumn(item, col.id);

                      return (
                        <td
                          key={col.id}
                          data-testid={`cell-${col.columnType}`}
                          className={`py-2.5 px-3 ${
                            isEditing ? '' : 'cursor-pointer hover:bg-blue-50/50'
                          }`}
                          onClick={(e) => {
                            // Cell content click → edit, NOT select. Stop the
                            // bubble so the row-click selection handler doesn't
                            // see it (ADR 21C: edit-eligible cells preserve
                            // existing selection).
                            e.stopPropagation();
                            if (!isEditing && col.columnType !== 'formula') {
                              onCellClick(item.id, col.id);
                            }
                          }}
                        >
                          {isEditing ? (
                            <ColumnEditor
                              column={col}
                              value={cellValue}
                              onChange={(newValue) => onCellChange(item.id, col.id, newValue)}
                              onBlur={onCellBlur}
                            />
                          ) : (
                            <ColumnRenderer column={col} value={cellValue} compact />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {onItemCreate && (
                <tr className="border-b border-gray-100">
                  <td
                    colSpan={columns.length + 2}
                    className="py-1.5 px-3"
                    style={{ borderLeft: '3px solid transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={14} className="text-gray-400" />
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem();
                        }}
                        placeholder="+ Add item"
                        aria-label={`Add item to ${group.name}`}
                        data-testid="inline-add-item-input"
                        className="text-sm text-gray-500 outline-none bg-transparent flex-1 placeholder-gray-400"
                      />
                      {newItemName.trim() && (
                        <button
                          onClick={handleAddItem}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {groupItems.length === 0 && !onItemCreate && (
            <p className="text-sm text-gray-400 py-4 px-3">No items in this group</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TableView({
  board,
  items,
  onItemUpdate,
  onItemCreate,
  onItemDelete: _onItemDelete,
  filterKey,
  onSelectionChange,
  clearSelectionToken,
}: TableViewProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<number | null>(null);

  // Phase D — mirror selection upstream. Fires on mount with the empty
  // Set and on every transition. Effect (vs inline setState callback)
  // keeps the parent notification deferred until after commit, avoiding
  // setState-during-render warnings.
  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Phase D — imperative clear via token bump. We track the previous
  // token in a ref so the effect only fires when the value *changes*.
  // This keeps the contract simple (no special undefined handling) and
  // avoids wiping selection on benign re-renders that pass the same
  // token. The initial-mount run is intentionally guarded — TableView
  // boots with empty selection anyway, so a same-value first run would
  // be a no-op, and skipping it keeps onSelectionChange's mount call
  // semantics clean.
  const lastClearToken = useRef<number | undefined>(clearSelectionToken);
  useEffect(() => {
    if (lastClearToken.current !== clearSelectionToken) {
      lastClearToken.current = clearSelectionToken;
      setSelectedIds(new Set());
      setLastClickedId(null);
    }
  }, [clearSelectionToken]);

  const columns = (board.columns || []).sort((a, b) => a.position - b.position);
  const groups = (board.groups || []).sort((a, b) => a.position - b.position);

  // Visible-id order matches render order: groups in position order, items
  // within each group in their array order. This is the basis for Shift+click
  // ranges and for the header checkbox's "select all visible" set.
  const visibleIds = useMemo(() => {
    const ids: number[] = [];
    for (const g of groups) {
      for (const it of items) {
        if (it.groupId === g.id) ids.push(it.id);
      }
    }
    return ids;
  }, [groups, items]);

  // ADR 21C-3: filter change clears selection. Sort change preserves it.
  // We use a ref to skip the initial mount so an unset filterKey doesn't
  // wipe selection on first render.
  const lastFilterKey = useRef<string | number | undefined>(filterKey);
  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey;
      setSelectedIds(new Set());
      setLastClickedId(null);
    }
  }, [filterKey]);

  // ADR: Escape clears selection. Listener only attaches when there's
  // something to clear — avoids global keystroke pollution per plan OQ #2.
  useEffect(() => {
    if (selectedIds.size === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setLastClickedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds.size]);

  const handleCellClick = useCallback((itemId: number, columnId: number) => {
    setEditingCell({ itemId, columnId });
  }, []);

  const handleCellChange = useCallback(
    (itemId: number, columnId: number, value: any) => {
      onItemUpdate?.(itemId, columnId, value);
    },
    [onItemUpdate]
  );

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const applyClick = useCallback(
    (itemId: number, e: React.MouseEvent | React.KeyboardEvent) => {
      const modifiers: ClickModifiers = {
        shift: e.shiftKey,
        meta: e.metaKey || e.ctrlKey,
      };
      setSelectedIds((prev) => {
        const { next, nextLastClickedId } = computeNextSelection(
          prev,
          itemId,
          modifiers,
          lastClickedId,
          visibleIds
        );
        setLastClickedId(nextLastClickedId);
        return next;
      });
    },
    [lastClickedId, visibleIds]
  );

  const handleRowClick = useCallback(
    (itemId: number, e: React.MouseEvent) => {
      applyClick(itemId, e);
    },
    [applyClick]
  );

  const handleCheckboxClick = useCallback(
    (itemId: number, e: React.MouseEvent) => {
      // Checkbox click should behave like a row click but NOT bubble to the
      // row's onClick (which would re-fire the same logic).
      e.stopPropagation();
      applyClick(itemId, e);
    },
    [applyClick]
  );

  const handleHeaderToggle = useCallback((groupItemIds: number[]) => {
    setSelectedIds((prev) => {
      const allSelected =
        groupItemIds.length > 0 && groupItemIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of groupItemIds) next.delete(id);
      } else {
        for (const id of groupItemIds) next.add(id);
      }
      return next;
    });
  }, []);

  if (groups.length === 0) {
    return (
      <div data-testid="table-view" className="text-center py-12">
        <p className="text-gray-500">No groups configured for this board.</p>
      </div>
    );
  }

  return (
    <div data-testid="table-view" className="space-y-2">
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          columns={columns}
          items={items}
          editingCell={editingCell}
          selectedIds={selectedIds}
          onRowClick={handleRowClick}
          onCheckboxClick={handleCheckboxClick}
          onHeaderToggle={handleHeaderToggle}
          onCellClick={handleCellClick}
          onCellChange={handleCellChange}
          onCellBlur={handleCellBlur}
          onItemCreate={onItemCreate}
        />
      ))}
    </div>
  );
}
