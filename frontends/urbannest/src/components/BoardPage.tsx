import { useCallback, useMemo, useState } from 'react';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useBoard } from '@crm/shared/hooks/useBoard';
import { useAuth } from '../context/AuthContext';
import type { BoardView as BoardViewType } from '../types';

interface BoardPageProps {
  /**
   * Slice 20.5 B: parent App.tsx now passes the selected board's id
   * (parsed from the activeView state key) rather than threading
   * board/items/loading down. The shared useBoard hook owns fetching,
   * WebSocket subscription, and CRUD mutations.
   */
  boardId: number;
}

/**
 * UrbanNest state-based board page (Slice 20.5 B — useBoard adoption).
 *
 * Pre-20.5 this component received `board`, `items`, and `loading` as
 * props from App.tsx, mirrored items into local state, and defined its
 * own optimistic CRUD handlers against a UrbanNest-local REST client.
 *
 * Post-20.5 the shared `useBoard(boardId)` hook owns:
 *   - Initial board + items fetch
 *   - WebSocket subscription (item:created/updated/deleted, column:value)
 *   - createItem / updateItemValue / deleteItem mutations with
 *     optimistic updates, rollback on error, and toast-on-failure
 *
 * What stays UrbanNest-specific:
 *   - Local `viewMode` toggle (table | kanban) → synthesised currentView
 *   - Client-side `searchQuery` filter (server-side search is a Slice 21+
 *     concern — keeping the existing UX behaviour)
 *   - Role-gated CRUD via canItemCrud (admin + member only)
 *   - Branded loading/empty states
 */
export function BoardPage({ boardId }: BoardPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Shared hook: fetch + realtime + mutations. Authentication uses the
  // urbannest_token key configured at app boot in main.tsx.
  const { board, items, loading, createItem, updateItemValue, deleteItem } =
    useBoard(boardId);

  // RBAC gating (Slice 20B C4): viewer role sees zero CRUD affordances.
  // admin + member get create/edit/delete on items — the shared
  // BoardView only renders the affordances when the callback props
  // are defined, so passing undefined hides the buttons.
  const canItemCrud = user?.role === 'admin' || user?.role === 'member';

  // BoardView's onItemCreate prop signature is (groupId, name) — adapt
  // it to useBoard.createItem's CreateItemMutationInput shape. Stable
  // ref via useCallback so BoardView's memoised lane components don't
  // re-render on every parent render.
  const handleCreateItem = useCallback(
    (groupId: number, name: string) => {
      void createItem({ groupId, name });
    },
    [createItem]
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

      {/* Board Content — useBoard mutations are wired through the shared
          BoardView so CRUD affordances (inline + Add item / kebab delete /
          inline edit) are consistent with every industry migration. */}
      <div className="card p-4">
        <BoardView
          board={board as unknown as Parameters<typeof BoardView>[0]['board']}
          items={filteredItems as unknown as Parameters<typeof BoardView>[0]['items']}
          currentView={currentView as unknown as Parameters<typeof BoardView>[0]['currentView']}
          onItemCreate={canItemCrud ? handleCreateItem : undefined}
          onItemUpdate={canItemCrud ? updateItemValue : undefined}
          onItemDelete={canItemCrud ? deleteItem : undefined}
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
