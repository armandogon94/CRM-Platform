import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board, Item, BoardView as BoardViewType } from '../types';

/**
 * NovaPay router-based board page (Slice 19.6 migration + Slice 20 C1 CRUD wiring).
 *
 * Reads `:id` from `/boards/:id` via `useParams`, fetches the board +
 * items independently. C1 adds CRUD wiring:
 *
 *   - onItemCreate → POST /items (seed 'Status' = New by convention;
 *     backend assigns groupId; UI locally appends on success)
 *   - onItemUpdate → PUT /items/:id/values (inline-edit path)
 *   - onItemDelete → DELETE /items/:id (flat shim from A2.5)
 *
 * Every failure emits a toast via the shared <ToastProvider> mounted
 * in main.tsx. Replaces the "+ New Item" placeholder button with the
 * shared BoardView component which exposes the `+ Add item` affordance
 * inside each KanbanLane / TableGroup natively (per Slice 20 B1).
 *
 * DOM contract required by Slice 19 D1 spec remains:
 *   - h1 with the board's name
 *   - A primary CTA in the toolbar (now threaded via BoardView)
 */
export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = id ? parseInt(id, 10) : NaN;
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

  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isNaN(boardId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.getBoard(boardId), api.getBoardItems(boardId)]).then(
      ([boardRes, itemsRes]) => {
        if (boardRes.success && boardRes.data) {
          setBoard(boardRes.data.board);
        }
        if (itemsRes.success && itemsRes.data) {
          setItems(itemsRes.data.items || []);
        }
        setLoading(false);
      }
    );
  }, [boardId]);

  // ── CRUD handlers threaded to <BoardView> ──────────────────────────
  //
  // Local-api path (NovaPay's existing auth-token conventions apply).
  // Using the shared useBoard hook would require unifying the token
  // key between NovaPay's `novapay_token` and shared's
  // `crm_access_token` — tracked as a cleanup item. For C1 these
  // handlers suffice: they cover the same four endpoints, emit toasts
  // on error via the shared provider, and keep local state in sync
  // without Socket.io echo (NovaPay's existing socket is untouched).

  const handleItemCreate = useCallback(
    async (groupId: number, name: string) => {
      const res = await api.createItem({ boardId, groupId, name });
      if (res.success && res.data?.item) {
        setItems((prev) => [...prev, res.data!.item]);
      } else {
        showToast({
          variant: 'error',
          title: 'Could not create item',
          description: res.error ?? 'Please try again.',
        });
      }
    },
    [boardId, showToast]
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

  // Shared BoardView expects a `currentView: BoardView` prop matching
  // the selected UI mode — synthesise a minimal one from local state
  // rather than pulling the full BoardView list from the API.
  const currentView: BoardViewType = useMemo(
    () => ({
      id: viewMode === 'table' ? 1 : 2,
      boardId,
      name: viewMode === 'table' ? 'Table' : 'Kanban',
      viewType: viewMode,
      settings: {},
      isDefault: false,
    }),
    [viewMode, boardId]
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
    <div className="space-y-4 p-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Slice 19 D1 asserts `getByRole('heading', { level: 1, name: <board> })` */}
          <h1 className="text-xl font-bold text-gray-900">{board.name}</h1>
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
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64"
          />
        </div>
      </div>

      {/* Board Content — Slice 20 C1 uses shared BoardView so CRUD
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

      {/* Footer Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{filteredItems.length} items</span>
        <span>{board.groups?.length || 0} groups</span>
        <span>{board.columns?.length || 0} columns</span>
      </div>
    </div>
  );
}
