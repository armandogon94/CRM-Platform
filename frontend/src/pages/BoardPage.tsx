import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useBoard } from '@/hooks/useBoard';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Table,
  LayoutGrid,
  Calendar,
  BarChart3,
  Search,
  Filter,
  SortAsc,
  Users,
  Plus,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import type { BoardView, Item, Column } from '@/types';

type ViewType = BoardView['viewType'];

const VIEW_ICONS: Record<ViewType, typeof Table> = {
  table: Table,
  kanban: LayoutGrid,
  calendar: Calendar,
  timeline: BarChart3,
  dashboard: BarChart3,
  map: BarChart3,
  chart: BarChart3,
  form: BarChart3,
};

const VIEW_LABELS: Record<ViewType, string> = {
  table: 'Table',
  kanban: 'Kanban',
  calendar: 'Calendar',
  timeline: 'Timeline',
  dashboard: 'Dashboard',
  map: 'Map',
  chart: 'Chart',
  form: 'Form',
};

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { board, items, loading, error, refreshItems } = useBoard(boardId);
  const [activeView, setActiveView] = useState<ViewType>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // WebSocket for real-time updates
  useWebSocket(boardId, {
    onItemCreated: () => refreshItems(),
    onItemUpdated: () => refreshItems(),
    onItemDeleted: () => refreshItems(),
    onColumnValueChanged: () => refreshItems(),
  });

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  // Group items by their groupId
  const groupedItems = useMemo(() => {
    if (!board?.groups) return {};
    const groups: Record<number, Item[]> = {};
    for (const group of board.groups) {
      groups[group.id] = filteredItems.filter((item) => item.groupId === group.id);
    }
    return groups;
  }, [board?.groups, filteredItems]);

  const availableViews: ViewType[] = board?.views?.map((v) => v.viewType) || [
    'table',
    'kanban',
  ];

  // Ensure at least table view is always available
  if (!availableViews.includes('table')) {
    availableViews.unshift('table');
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading board...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !board) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Failed to load board
            </h3>
            <p className="text-gray-500 text-sm">{error || 'Board not found'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Board Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {board.description}
                </p>
              )}
            </div>
            <button className="bg-brand-primary hover:opacity-90 text-white font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 text-sm">
              <Plus size={16} />
              New Item
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1">
            {availableViews.map((viewType) => {
              const Icon = VIEW_ICONS[viewType];
              return (
                <button
                  key={viewType}
                  onClick={() => setActiveView(viewType)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    activeView === viewType
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={14} />
                  {VIEW_LABELS[viewType]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
              />
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={14} />
              Filter
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <SortAsc size={14} />
              Sort
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Users size={14} />
              Person
            </button>
          </div>

          <div className="text-xs text-gray-400">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Board Content - Table View */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === 'table' ? (
            <TableView
              board={board}
              groups={board.groups || []}
              columns={board.columns || []}
              groupedItems={groupedItems}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <LayoutGrid size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {VIEW_LABELS[activeView]} view coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// Inline TableView component
function TableView({
  board,
  groups,
  columns,
  groupedItems,
}: {
  board: { id: number; name: string };
  groups: { id: number; name: string; color: string; isCollapsed: boolean }[];
  columns: Column[];
  groupedItems: Record<number, Item[]>;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
    new Set(groups.filter((g) => g.isCollapsed).map((g) => g.id))
  );

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const getColumnValue = (item: Item, columnId: number): string => {
    const cv = item.columnValues?.find((v) => v.columnId === columnId);
    if (!cv || cv.value === null || cv.value === undefined) return '';
    if (typeof cv.value === 'object') return JSON.stringify(cv.value);
    return String(cv.value);
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const groupItems = groupedItems[group.id] || [];

        return (
          <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <ChevronDown
                size={16}
                className={clsx(
                  'text-gray-400 transition-transform',
                  isCollapsed && '-rotate-90'
                )}
              />
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: group.color || '#6366f1' }}
              />
              <span className="font-semibold text-sm text-gray-900">
                {group.name}
              </span>
              <span className="text-xs text-gray-400 ml-1">
                {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
              </span>
            </button>

            {/* Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-gray-100">
                      <th
                        className="text-left font-medium text-gray-500 px-4 py-2 bg-gray-50 min-w-[200px]"
                        style={{ borderLeft: `3px solid ${group.color || '#6366f1'}` }}
                      >
                        Item
                      </th>
                      {sortedColumns.map((col) => (
                        <th
                          key={col.id}
                          className="text-left font-medium text-gray-500 px-4 py-2 bg-gray-50"
                          style={{ minWidth: col.width || 150 }}
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={sortedColumns.length + 1}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          No items in this group
                        </td>
                      </tr>
                    ) : (
                      groupItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors"
                        >
                          <td
                            className="px-4 py-2.5 font-medium text-gray-900"
                            style={{
                              borderLeft: `3px solid ${group.color || '#6366f1'}`,
                            }}
                          >
                            {item.name}
                          </td>
                          {sortedColumns.map((col) => (
                            <td
                              key={col.id}
                              className="px-4 py-2.5 text-gray-600"
                            >
                              {getColumnValue(item, col.id)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No groups in this board yet</p>
        </div>
      )}
    </div>
  );
}
