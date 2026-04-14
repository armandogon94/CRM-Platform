import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useBoard } from '../hooks/useBoard';
import { FilterPanel, type FilterItem } from '../components/common/FilterPanel';
import { SortPanel, type SortRule } from '../components/common/SortPanel';
import { BoardView } from '../components/board/BoardView';
import api from '../utils/api';
import {
  Table,
  LayoutGrid,
  Calendar,
  BarChart3,
  Map,
  Search,
  Filter,
  SortAsc,
  Plus,
  AlertCircle,
  Save,
  Activity,
} from 'lucide-react';
import type { BoardView as BoardViewType } from '../types/index';
import type { ThemeConfig } from '../theme';

type ViewType = BoardViewType['viewType'];

const VIEW_ICONS: Record<ViewType, React.ElementType> = {
  table: Table,
  kanban: LayoutGrid,
  calendar: Calendar,
  timeline: BarChart3,
  dashboard: BarChart3,
  map: Map,
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

interface BoardPageProps {
  theme?: ThemeConfig;
}

export default function BoardPage({ theme }: BoardPageProps) {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { board, items, loading, error, refreshItems, refreshBoard } = useBoard(boardId);

  const [activeView, setActiveView] = useState<ViewType>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  const primaryColor = theme?.primaryColor || '#2563EB';

  const activeViewRecord = board?.views?.find(
    (v) => v.viewType === activeView
  ) ?? board?.views?.[0];

  useEffect(() => {
    if (!activeViewRecord?.settings) return;
    const saved = activeViewRecord.settings as {
      savedFilters?: FilterItem[];
      savedSorts?: SortRule[];
    };
    if (saved.savedFilters && saved.savedFilters.length > 0) {
      setFilters(saved.savedFilters);
    }
    if (saved.savedSorts && saved.savedSorts.length > 0) {
      setSorts(saved.savedSorts);
    }
  }, [activeViewRecord?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePreset = useCallback(async () => {
    if (!activeViewRecord || !board) return;
    await api.put(
      `/workspaces/${board.workspaceId}/boards/${board.id}/views/${activeViewRecord.id}`,
      {
        settings: {
          ...activeViewRecord.settings,
          savedFilters: filters,
          savedSorts: sorts,
        },
      }
    );
  }, [activeViewRecord, board, filters, sorts]);

  const handleFiltersChange = useCallback(
    (newFilters: FilterItem[]) => {
      setFilters(newFilters);
      const sortByColumn = sorts.length > 0 ? sorts[0].columnId : undefined;
      const sortOrder = sorts.length > 0 ? sorts[0].direction : undefined;
      refreshItems({
        columnFilters: newFilters.length > 0 ? newFilters : undefined,
        sortByColumn,
        sortOrder,
      });
    },
    [refreshItems, sorts]
  );

  const handleSortsChange = useCallback(
    (newSorts: SortRule[]) => {
      setSorts(newSorts);
      const sortByColumn = newSorts.length > 0 ? newSorts[0].columnId : undefined;
      const sortOrder = newSorts.length > 0 ? newSorts[0].direction : undefined;
      refreshItems({
        columnFilters: filters.length > 0 ? filters : undefined,
        sortByColumn,
        sortOrder,
      });
    },
    [refreshItems, filters]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const availableViews: ViewType[] = board?.views?.map((v) => v.viewType) || [
    'table',
    'kanban',
  ];

  if (!availableViews.includes('table')) {
    availableViews.unshift('table');
  }

  if (loading) {
    return (
      <MainLayout theme={theme}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
            />
            <p className="text-gray-500 text-sm">Loading board...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !board) {
    return (
      <MainLayout theme={theme}>
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

  const currentView = board.views?.find((v) => v.viewType === activeView) ??
    ({
      id: 0,
      boardId: board.id,
      viewType: activeView,
      name: VIEW_LABELS[activeView],
      position: 0,
      settings: {},
      layoutJson: null,
      isDefault: false,
    } as BoardViewType);

  return (
    <MainLayout theme={theme}>
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
            <button
              className="text-white font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 text-sm hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={16} />
              New Item
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1">
            {availableViews.map((viewType) => {
              const Icon = VIEW_ICONS[viewType];
              const isActive = activeView === viewType;
              return (
                <button
                  key={viewType}
                  onClick={() => setActiveView(viewType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
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

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors relative ${
                filters.length > 0
                  ? 'text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} />
              Filter
              {filters.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {filters.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSortPanel(!showSortPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                sorts.length > 0
                  ? 'text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SortAsc size={14} />
              Sort
              {sorts.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {sorts.length}
                </span>
              )}
            </button>

            {(filters.length > 0 || sorts.length > 0) && activeViewRecord && (
              <button
                onClick={handleSavePreset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 border border-green-300 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Save size={14} />
                Save preset
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filter/Sort Panels */}
        {showFilterPanel && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <FilterPanel
              columns={board.columns || []}
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>
        )}

        {showSortPanel && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <SortPanel
              columns={board.columns || []}
              sorts={sorts}
              onChange={handleSortsChange}
            />
          </div>
        )}

        {/* Board Content */}
        <div className="flex-1 overflow-auto p-6">
          <BoardView
            board={board}
            items={filteredItems}
            currentView={currentView}
          />
        </div>
      </div>
    </MainLayout>
  );
}
