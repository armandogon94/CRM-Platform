import { useCallback, useMemo, useState } from 'react';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board, Item, BoardView as BoardViewType } from '../types';

/**
 * JurisPath state-based board page (Slice 20 C3 CRUD wiring).
 *
 * JurisPath uses `activeView` state in App.tsx for navigation rather
 * than react-router — so the parent owns both the selected board and
 * its items. C3 keeps that arrangement but accepts an `onItemsChange`
 * dispatcher so this component can run optimistic updates with
 * rollback semantics against the parent's state.
 *
 * CRUD wiring (mirrors NovaPay C1):
 *
 *   - onItemCreate → POST /items
 *   - onItemUpdate → PUT /items/:id/values (optimistic + rollback)
 *   - onItemDelete → DELETE /items/:id  (optimistic + rollback)
 *
 * Every failure emits a toast via the shared <ToastProvider> mounted
 * in main.tsx. JurisPath's 3-board domain (cases, clients, invoices)
 * exercises the shared components against three distinct Status
 * workflows without any per-board special-casing in this layer.
 *
 * Kept JurisPath's local api.ts rather than swapping to the shared
 * useBoard hook — the shared hook hardcodes `crm_access_token` while
 * JurisPath uses `jurispath_token`. Same trade-off NovaPay's C1
 * accepted; unifying token keys is tracked as a future cleanup.
 */

interface BoardPageProps {
  board: Board | null;
  items: Item[];
  loading: boolean;
  onItemsChange?: React.Dispatch<React.SetStateAction<Item[]>>;
}

export function BoardPage({ board, items, loading, onItemsChange }: BoardPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const { show: showToast } = useToast();
  const { user } = useAuth();

  // RBAC gating (Slice 20 C4): viewer role sees zero CRUD affordances.
  // admin + member get create/edit/delete on items — the shared
  // BoardView only renders the affordances when the callback props
  // are defined, so setting them to undefined hides the buttons.
  // Passing the full callback set for admin/member matches the Slice
  // 20 RBAC matrix (member's "no board create" is gated inside
  // BoardListPage; per-item CRUD is open).
  const canItemCrud = user?.role === 'admin' || user?.role === 'member';

  // ── CRUD handlers threaded to <BoardView> ──────────────────────────
  //
  // Using JurisPath's existing `api` client + parent-owned state.
  // onItemsChange is optional so the component stays usable in any
  // future caller that only needs a read-only board — but whenever
  // AppContent wires it in, the full optimistic flow applies.

  const handleItemCreate = useCallback(
    async (groupId: number, name: string) => {
      if (!board) return;
      const res = await api.createItem({ boardId: board.id, groupId, name });
      if (res.success && res.data?.item) {
        onItemsChange?.((prev) => [...prev, res.data!.item as Item]);
      } else {
        showToast({
          variant: 'error',
          title: 'Could not create item',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [board, onItemsChange, showToast]
  );

  const handleItemUpdate = useCallback(
    async (itemId: number, columnId: number, value: unknown) => {
      const snapshot = items;
      onItemsChange?.((prev) =>
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
        onItemsChange?.(snapshot);
        showToast({
          variant: 'error',
          title: 'Could not update value',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [items, onItemsChange, showToast]
  );

  const handleItemDelete = useCallback(
    async (itemId: number) => {
      const snapshot = items;
      onItemsChange?.((prev) => prev.filter((i) => i.id !== itemId));
      const res = await api.deleteItem(itemId);
      if (!res.success) {
        onItemsChange?.(snapshot);
        showToast({
          variant: 'error',
          title: 'Could not delete item',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [items, onItemsChange, showToast]
  );

  // Shared BoardView expects a `currentView: BoardView` prop matching
  // the selected UI mode — synthesise a minimal one from local state
  // rather than pulling the full BoardView list from the API.
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{board.name}</h2>
          {board.description && (
            <p className="text-sm text-gray-500 mt-0.5">{board.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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

      {/* Board Content — Slice 20 C3 uses shared BoardView so CRUD
          affordances (inline + Add item / kebab delete / inline edit)
          are consistent with every future industry migration. */}
      <div className="card p-4">
        <BoardView
          board={board as unknown as Parameters<typeof BoardView>[0]['board']}
          items={filteredItems as unknown as Parameters<typeof BoardView>[0]['items']}
          currentView={currentView as unknown as Parameters<typeof BoardView>[0]['currentView']}
          onItemCreate={canItemCrud ? handleItemCreate : undefined}
          onItemUpdate={canItemCrud ? handleItemUpdate : undefined}
          onItemDelete={canItemCrud ? handleItemDelete : undefined}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{filteredItems.length} items</span>
        <span>{board.groups?.length || 0} groups</span>
        <span>{board.columns?.length || 0} columns</span>
      </div>
    </div>
  );
}
