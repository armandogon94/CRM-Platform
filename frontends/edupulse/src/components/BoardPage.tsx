import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { api } from '../utils/api';
import type { Board, Item, BoardView as BoardViewType } from '../types';

interface BoardPageProps {
  board: Board | null;
  items: Item[];
  loading: boolean;
}

/**
 * EduPulse state-based board page (Slice 20B C2 CRUD wiring).
 *
 * Like MedVista (and unlike NovaPay's router-based shape), EduPulse's
 * parent App.tsx drives board selection via `activeView` state and
 * passes `board` + `items` down as props. This component mirrors them
 * into local state so we can apply optimistic CRUD updates without
 * threading setters through App.
 *
 * C2 migrates from EduPulse's local KanbanView/BoardTable fork to the
 * shared BoardView. Three CRUD callbacks are wired through to the
 * EduPulse-local REST client (which uses the `edupulse_token` key
 * convention — we keep the local api rather than shared useBoard for
 * the same reason NovaPay/MedVista did in C1/C2).
 *
 *   - onItemCreate → POST /items (backend assigns groupId)
 *   - onItemUpdate → PUT /items/:id/values (optimistic + rollback)
 *   - onItemDelete → DELETE /items/:id (A2.5 flat shim, optimistic + rollback)
 *
 * Every failure emits a toast via the shared <ToastProvider>.
 */
export function BoardPage({ board, items: propItems, loading }: BoardPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>(propItems);
  const { show: showToast } = useToast();

  // Sync from parent when the selected board changes (App re-fetches).
  useEffect(() => {
    setItems(propItems);
  }, [propItems]);

  // ── CRUD handlers threaded to <BoardView> ──────────────────────────
  const handleItemCreate = useCallback(
    async (groupId: number, name: string) => {
      if (!board) return;
      const res = await api.createItem({ boardId: board.id, groupId, name });
      if (res.success && res.data?.item) {
        setItems((prev) => [...prev, res.data!.item as Item]);
      } else {
        showToast({
          variant: 'error',
          title: 'Could not create item',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [board, showToast]
  );

  const handleItemUpdate = useCallback(
    async (itemId: number, columnId: number, value: unknown) => {
      // Optimistic update — write locally, roll back on error.
      const snapshot = items;
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const cvs = it.columnValues ?? [];
          const idx = cvs.findIndex((c) => c.columnId === columnId);
          const nextCvs =
            idx >= 0
              ? cvs.map((c) =>
                  c.columnId === columnId ? { ...c, value } : c
                )
              : [
                  ...cvs,
                  { id: -1, itemId, columnId, value } as (typeof cvs)[number],
                ];
          return { ...it, columnValues: nextCvs };
        })
      );
      const res = await api.updateColumnValues(itemId, [{ columnId, value }]);
      if (!res.success) {
        setItems(snapshot);
        showToast({
          variant: 'error',
          title: 'Could not update value',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [items, showToast]
  );

  const handleItemDelete = useCallback(
    async (itemId: number) => {
      const snapshot = items;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      const res = await api.deleteItem(itemId);
      if (!res.success) {
        setItems(snapshot);
        showToast({
          variant: 'error',
          title: 'Could not delete item',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [items, showToast]
  );

  // Shared BoardView expects a `currentView: BoardView` prop matching the
  // selected UI mode — synthesise one from local viewMode state rather
  // than pulling the BoardView list from the API.
  const currentView: BoardViewType = useMemo(
    () => ({
      id: viewMode === 'table' ? 1 : 2,
      boardId: board?.id ?? 0,
      name: viewMode === 'table' ? 'Table' : 'Kanban',
      viewType: viewMode,
      settings: {},
      isDefault: false,
    }),
    [viewMode, board?.id]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Board not found</p>
      </div>
    );
  }

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{board.name}</h2>
          {board.description && (
            <p className="text-sm text-gray-500 mt-0.5">{board.description}</p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table size={14} />
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
          </div>

          <button className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
            <Filter size={14} />
            Filter
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64"
          />
        </div>
      </div>

      {/* Board Content — Slice 20B C2 uses shared BoardView so CRUD
          affordances (inline + Add item / kebab delete / inline edit)
          are consistent with every industry migration. */}
      <div className="card p-4">
        <BoardView
          board={board as unknown as Parameters<typeof BoardView>[0]['board']}
          items={filteredItems as unknown as Parameters<typeof BoardView>[0]['items']}
          currentView={currentView as unknown as Parameters<typeof BoardView>[0]['currentView']}
          onItemCreate={handleItemCreate}
          onItemUpdate={handleItemUpdate}
          onItemDelete={handleItemDelete}
        />
      </div>

      {/* Footer Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{filteredItems.length} items</span>
        <span>{board.groups?.length || 0} groups</span>
        <span>{board.columns?.length || 0} columns</span>
      </div>
    </div>
  );
}
