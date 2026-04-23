import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import type { Board, Column, Item, ColumnValue } from '../../types/index';
import { ColumnRenderer } from './ColumnRenderer';
import { normalizeStatusValue, type StatusOption } from '../../utils/status';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface KanbanViewProps {
  board: Board;
  items: Item[];
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}

function getStatusValue(
  item: Item,
  statusColumn: Column | undefined
): { label: string; color: string } | null {
  if (!statusColumn) return null;
  const cv = item.columnValues?.find(
    (v: ColumnValue) => v.columnId === statusColumn.id
  );
  // Normalise the raw value through the shared helper — this is the bucket
  // key used by every Kanban lane, so non-canonical seed shapes (plain
  // strings, `{ labelId }`) must still route items to the right lane.
  const options = (statusColumn.config as { options?: StatusOption[] })?.options;
  return normalizeStatusValue(cv?.value, options);
}

function getColumnValue(item: Item, columnId: number): any {
  const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === columnId);
  return cv?.value ?? null;
}

export function KanbanView({ board, items, onItemCreate, onItemDelete }: KanbanViewProps) {
  const statusColumn = board.columns?.find((c) => c.columnType === 'status');
  const statusOptions =
    (statusColumn?.config as { options?: { label: string; color: string }[] })?.options || [];

  const cardColumns = (board.columns || [])
    .filter(
      (c) =>
        c.columnType !== 'status' &&
        c.columnType !== 'long_text' &&
        c.columnType !== 'formula'
    )
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);

  const lanes = statusOptions.map((opt) => ({
    ...opt,
    items: items.filter((item) => {
      const val = getStatusValue(item, statusColumn);
      return val?.label === opt.label;
    }),
  }));

  const uncategorized = items.filter((item) => {
    const val = getStatusValue(item, statusColumn);
    return !val || !statusOptions.some((o) => o.label === val.label);
  });

  return (
    <div data-testid="kanban-view" className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {uncategorized.length > 0 && (
        <KanbanLane
          label="Uncategorized"
          color="#9CA3AF"
          items={uncategorized}
          cardColumns={cardColumns}
          board={board}
          onItemDelete={onItemDelete}
        />
      )}
      {lanes.map((lane) => (
        <KanbanLane
          key={lane.label}
          label={lane.label}
          color={lane.color}
          items={lane.items}
          cardColumns={cardColumns}
          board={board}
          onItemCreate={onItemCreate}
          onItemDelete={onItemDelete}
        />
      ))}
    </div>
  );
}

function KanbanLane({
  label,
  color,
  items,
  cardColumns,
  board,
  onItemCreate,
  onItemDelete,
}: {
  label: string;
  color: string;
  items: Item[];
  cardColumns: Column[];
  board: Board;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  function handleAddItem() {
    if (!newItemName.trim() || !onItemCreate) return;
    const firstGroupId = board.groups?.[0]?.id;
    if (firstGroupId) {
      onItemCreate(firstGroupId, newItemName.trim());
    }
    setNewItemName('');
    setIsAdding(false);
  }

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            color={color}
            cardColumns={cardColumns}
            onItemDelete={onItemDelete}
          />
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            No items
          </div>
        )}

        {onItemCreate && (
          <div>
            {isAdding ? (
              <div className="bg-white rounded-lg border border-blue-300 p-3">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewItemName('');
                    }
                  }}
                  placeholder="Item name..."
                  className="w-full text-sm outline-none mb-2"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddItem}
                    disabled={!newItemName.trim()}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewItemName('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Single Kanban card. Renders item name + up to 3 non-status card
 * columns, plus a kebab menu in the top-right when onItemDelete is
 * wired. The kebab → menu → confirm-dialog flow lives here rather
 * than being hoisted to the lane so state (menu open, dialog open)
 * is scoped to each card — a delete confirm on card A doesn't affect
 * card B.
 */
function KanbanCard({
  item,
  color,
  cardColumns,
  onItemDelete,
}: {
  item: Item;
  color: string;
  cardColumns: Column[];
  onItemDelete?: (itemId: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Close the menu when the user clicks outside it. Simpler than a
  // formal click-away ref library given this is a one-item dropdown.
  React.useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    // Defer until after the current click resolves so the open click
    // doesn't immediately close the menu.
    const timer = setTimeout(() => {
      document.addEventListener('click', close);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [menuOpen]);

  return (
    <>
      <div
        className="relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        {onItemDelete && (
          <button
            type="button"
            aria-label="Item actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
        )}
        {onItemDelete && menuOpen && (
          <div
            role="menu"
            className="absolute top-8 right-2 z-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
        <p className="font-medium text-sm text-gray-900 mb-2 pr-6">{item.name}</p>
        {cardColumns.length > 0 && (
          <div className="space-y-1.5">
            {cardColumns.map((col) => {
              const val = getColumnValue(item, col.id);
              if (val === null || val === undefined) return null;
              return (
                <div key={col.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 min-w-[60px]">{col.name}:</span>
                  <ColumnRenderer column={col} value={val} compact />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {onItemDelete && (
        <ConfirmDialog
          open={confirmOpen}
          title={`Delete ${item.name}?`}
          description="This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => {
            setConfirmOpen(false);
            onItemDelete(item.id);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
