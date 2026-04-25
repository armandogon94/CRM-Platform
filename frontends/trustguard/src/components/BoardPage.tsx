import { useMemo, useState } from 'react';
import { Table, LayoutGrid, Search, Filter } from 'lucide-react';
import { BoardView } from '@crm/shared/components/board/BoardView';
import { useBoard } from '@crm/shared/hooks/useBoard';
import { useAuth } from '../context/AuthContext';
import type { BoardView as BoardViewType } from '../types';

interface BoardPageProps {
  boardId: number;
}

/**
 * TrustGuard board page (Slice 20.5 B — shared useBoard adoption).
 *
 * Replaces the Slice 20B C2 state-mirror + local-CRUD pattern. The shared
 * useBoard hook now owns: REST fetches for board + items, optimistic
 * mutations with toast-on-error rollback, WebSocket echo wiring, and
 * loading/error state. BoardPage is reduced to UI concerns only —
 * viewMode toggle, search filter, RBAC gating, and prop-bridging into
 * the shared <BoardView>.
 *
 * Token-key alignment is handled at boot in main.tsx via
 *   configureApi({ tokenKey: 'trustguard_token' })
 *   configureWebSocket({ tokenKey: 'trustguard_token' })
 * so this file no longer touches TrustGuard's local api.ts (App.tsx
 * still uses it for the OverviewDashboard KPI tiles, which read across
 * all boards).
 */
export function BoardPage({ boardId }: BoardPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const {
    board,
    items,
    loading,
    createItem,
    updateItemValue,
    deleteItem,
  } = useBoard(boardId);

  // RBAC gating (Slice 20B C4): viewer role sees zero CRUD affordances.
  // admin + member get create/edit/delete on items — the shared
  // BoardView only renders the affordances when the callback props
  // are defined, so setting them to undefined hides the buttons.
  const canItemCrud = user?.role === 'admin' || user?.role === 'member';

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

      {/* Board Content — shared BoardView with useBoard mutations wired
          through. createItem signature is { groupId, name } object form;
          the BoardView callback shape is (groupId, name) so we adapt. */}
      <div className="card p-4">
        <BoardView
          board={board}
          items={filteredItems}
          currentView={currentView as unknown as Parameters<typeof BoardView>[0]['currentView']}
          onItemCreate={
            canItemCrud
              ? (groupId: number, name: string) => createItem({ groupId, name })
              : undefined
          }
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
