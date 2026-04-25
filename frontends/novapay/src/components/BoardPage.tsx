import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useBoard } from '@crm/shared/hooks/useBoard';
import { useAuth } from '../context/AuthContext';
import type { Board, Item, BoardView as BoardViewType } from '../types';

/**
 * NovaPay router-based board page (Slice 19.6 migration + Slice 20 C1
 * CRUD wiring + Slice 20.5 B shared-hook adoption).
 *
 * Reads `:id` from `/boards/:id` via `useParams`, then delegates fetch +
 * mutations + Socket.io echo to the shared `useBoard` hook. After
 * `configureWebSocket({ tokenKey: 'novapay_token' })` ran at boot
 * (main.tsx), the shared WS handshake authenticates correctly under
 * NovaPay's slug-prefixed JWT key — so live `item:created` /
 * `item:updated` / `item:deleted` events flow into the local items
 * array automatically. The previous Slice 20 C1 optimistic-update +
 * rollback handlers (~80 LOC) are gone — useBoard owns that lifecycle.
 *
 * DOM contract required by Slice 19 D1 spec remains:
 *   - h1 with the board's name
 *   - A primary CTA in the toolbar (now threaded via BoardView)
 */
export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = id ? parseInt(id, 10) : NaN;
  const { user } = useAuth();

  // RBAC gating (Slice 20 C4): viewer role sees zero CRUD affordances.
  // admin + member get create/edit/delete on items — the shared
  // BoardView only renders the affordances when the callback props
  // are defined, so setting them to undefined hides the buttons.
  // Passing the full callback set for admin/member matches the Slice
  // 20 RBAC matrix (member's "no board create" is gated inside
  // BoardListPage; per-item CRUD is open).
  const canItemCrud = user?.role === 'admin' || user?.role === 'member';

  // Shared hook — owns board + items state, initial fetch, optimistic
  // mutations + rollback, toast-on-error, and Socket.io live updates.
  const { board, items, loading, createItem, updateItemValue, deleteItem } =
    useBoard(boardId);

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // BoardView's onItemCreate signature is `(groupId, name) => void` to
  // match the inline "+ Add item" affordance inside KanbanLane /
  // TableGroup. useBoard.createItem takes a structured input object
  // (so future callers can pass seed column values). Adapt with a
  // thin closure — no extra state, no rollback handling here.
  const handleItemCreate = useCallback(
    (groupId: number, name: string) => {
      void createItem({ groupId, name });
    },
    [createItem]
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

  // useBoard returns shared types; NovaPay's local Board/Item are
  // structurally identical but nominally distinct — bridge with
  // `as unknown as` casts at the BoardView prop boundary. Unifying
  // types is tracked as a future cleanup item.
  const localBoard = board as unknown as Board;
  const localItems = items as unknown as Item[];

  const filteredItems = searchQuery
    ? localItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : localItems;

  return (
    <div className="space-y-4 p-6">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Slice 19 D1 asserts `getByRole('heading', { level: 1, name: <board> })` */}
          <h1 className="text-xl font-bold text-gray-900">{localBoard.name}</h1>
          {localBoard.description && (
            <p className="text-sm text-gray-500 mt-0.5">{localBoard.description}</p>
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
          are consistent with every future industry migration. Slice
          20.5 B replaces local handlers with useBoard mutations. */}
      <div className="card p-4">
        <BoardView
          board={localBoard as unknown as Parameters<typeof BoardView>[0]['board']}
          items={filteredItems as unknown as Parameters<typeof BoardView>[0]['items']}
          currentView={currentView as unknown as Parameters<typeof BoardView>[0]['currentView']}
          onItemCreate={canItemCrud ? handleItemCreate : undefined}
          onItemUpdate={canItemCrud ? updateItemValue : undefined}
          onItemDelete={canItemCrud ? deleteItem : undefined}
        />
      </div>

      {/* Footer Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{filteredItems.length} items</span>
        <span>{localBoard.groups?.length || 0} groups</span>
        <span>{localBoard.columns?.length || 0} columns</span>
      </div>
    </div>
  );
}
