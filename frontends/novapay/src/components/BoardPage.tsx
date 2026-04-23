import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, LayoutGrid, Search, Filter, Plus } from 'lucide-react';
import { BoardTable } from './BoardTable';
import { KanbanView } from './KanbanView';
import { api } from '../utils/api';
import type { Board, Item } from '../types';

/**
 * NovaPay router-based board page (Slice 19.6 migration).
 *
 * Reads `:id` from `/boards/:id` via `useParams`, fetches the board +
 * items independently. Previously the parent App.tsx drove fetches
 * via `activeView` state; now this component owns its own lifecycle
 * keyed on URL id changes.
 *
 * DOM contract required by Slice 19 D1 spec:
 *   - h1 with the board's name (e.g. "Transaction Pipeline")
 *   - `<button>New Item</button>` in the toolbar
 */
export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = id ? parseInt(id, 10) : NaN;

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
        <div className="flex items-center gap-2">
          <button className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} />
            New Item
          </button>
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

      {/* Board Content */}
      <div className="card p-4">
        {viewMode === 'table' ? (
          <BoardTable board={board} items={filteredItems} />
        ) : (
          <KanbanView board={board} items={filteredItems} />
        )}
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
