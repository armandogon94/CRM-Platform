import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useBoard } from '@/hooks/useBoard';
import { FilterPanel, type FilterItem } from '@/components/common/FilterPanel';
import { SortPanel, type SortRule } from '@/components/common/SortPanel';
import { ColumnTypePickerModal } from '@/components/board/ColumnTypePickerModal';
import { ColorPicker } from '@/components/board/ColorPicker';
import api from '@/utils/api';
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
  Save,
  Pencil,
  Trash2,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
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
  const { board, items, loading, error, refreshItems, refreshBoard } = useBoard(boardId);
  const [activeView, setActiveView] = useState<ViewType>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter/Sort state
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // Find the active view for saving/loading presets
  const activeViewRecord = board?.views?.find(
    (v) => v.viewType === activeView
  ) ?? board?.views?.[0];

  // Load saved filters/sorts from view settings on mount
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

  // Save current filters/sorts to view settings
  const handleSavePreset = useCallback(async () => {
    if (!activeViewRecord || !board) return;
    const workspaceId = board.workspaceId;
    await api.put(
      `/workspaces/${workspaceId}/boards/${board.id}/views/${activeViewRecord.id}`,
      {
        settings: {
          ...activeViewRecord.settings,
          savedFilters: filters,
          savedSorts: sorts,
        },
      }
    );
  }, [activeViewRecord, board, filters, sorts]);

  // When filters or sorts change, re-fetch items from server
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

  // Client-side text search on top of server-filtered items
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

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors relative',
                filters.length > 0
                  ? 'text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              )}
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
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors',
                sorts.length > 0
                  ? 'text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              )}
            >
              <SortAsc size={14} />
              Sort
              {sorts.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {sorts.length}
                </span>
              )}
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Users size={14} />
              Person
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

        {/* Board Content - Table View */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === 'table' ? (
            <TableView
              board={board}
              groups={board.groups || []}
              columns={board.columns || []}
              groupedItems={groupedItems}
              items={filteredItems}
              onRefreshBoard={refreshBoard}
              onRefreshItems={refreshItems}
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

// Inline TableView component with column management and DnD
function TableView({
  board,
  groups,
  columns,
  groupedItems,
  items: allItems,
  onRefreshBoard,
  onRefreshItems,
}: {
  board: { id: number; name: string; workspaceId: number };
  groups: { id: number; name: string; color: string; isCollapsed: boolean }[];
  columns: Column[];
  groupedItems: Record<number, Item[]>;
  items: Item[];
  onRefreshBoard: () => void;
  onRefreshItems: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
    new Set(groups.filter((g) => g.isCollapsed).map((g) => g.id))
  );
  const [showColumnTypePicker, setShowColumnTypePicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ colId: number; x: number; y: number } | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Group management state
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [colorPickerGroupId, setColorPickerGroupId] = useState<number | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [contextMenu]);

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

  // Group handlers
  function handleStartGroupRename(groupId: number) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setEditingGroupId(groupId);
    setEditingGroupName(group.name);
  }

  async function handleFinishGroupRename() {
    if (editingGroupId === null || !editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    await api.put(
      `/workspaces/${board.workspaceId}/boards/${board.id}/groups/${editingGroupId}`,
      { name: editingGroupName.trim() }
    );
    setEditingGroupId(null);
    onRefreshBoard();
  }

  async function handleGroupColorChange(groupId: number, color: string) {
    setColorPickerGroupId(null);
    await api.put(
      `/workspaces/${board.workspaceId}/boards/${board.id}/groups/${groupId}`,
      { color }
    );
    onRefreshBoard();
  }

  async function handleDeleteGroup(groupId: number) {
    if (!window.confirm('Delete this group? Items will be moved to another group.')) return;
    await api.delete(
      `/workspaces/${board.workspaceId}/boards/${board.id}/groups/${groupId}`
    );
    onRefreshBoard();
  }

  async function handleAddGroup() {
    await api.post(
      `/workspaces/${board.workspaceId}/boards/${board.id}/groups`,
      { name: 'New Group' }
    );
    onRefreshBoard();
  }

  // DnD handler
  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'ITEM') {
      const itemId = parseInt(draggableId.replace('item-', ''), 10);
      const destGroupId = parseInt(destination.droppableId.replace('group-', ''), 10);
      const sourceGroupId = parseInt(source.droppableId.replace('group-', ''), 10);

      if (sourceGroupId !== destGroupId) {
        // Move item to different group
        await api.put(
          `/workspaces/${board.workspaceId}/boards/${board.id}/items/${itemId}/move`,
          { groupId: destGroupId }
        );
      } else {
        // Reorder within same group
        const groupItems = groupedItems[sourceGroupId] || [];
        const reordered = [...groupItems];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        await api.put(
          `/workspaces/${board.workspaceId}/boards/${board.id}/items/reorder`,
          { itemIds: reordered.map((i) => i.id) }
        );
      }
      onRefreshItems();
    }
  }

  async function handleAddColumn(columnType: string) {
    setShowColumnTypePicker(false);
    await api.post(
      `/workspaces/${board.workspaceId}/boards/${board.id}/columns`,
      { name: columnType.charAt(0).toUpperCase() + columnType.slice(1).replace('_', ' '), columnType }
    );
    onRefreshBoard();
  }

  function handleColumnContextMenu(e: React.MouseEvent, colId: number) {
    e.preventDefault();
    setContextMenu({ colId, x: e.clientX, y: e.clientY });
  }

  function handleStartRename(colId: number) {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    setEditingColumnId(colId);
    setEditingName(col.name);
    setContextMenu(null);
  }

  async function handleFinishRename() {
    if (editingColumnId === null || !editingName.trim()) {
      setEditingColumnId(null);
      return;
    }
    await api.put(
      `/workspaces/${board.workspaceId}/boards/${board.id}/columns/${editingColumnId}`,
      { name: editingName.trim() }
    );
    setEditingColumnId(null);
    onRefreshBoard();
  }

  async function handleDeleteColumn(colId: number) {
    setContextMenu(null);
    if (!window.confirm('Delete this column? All values in this column will be lost.')) return;
    await api.delete(
      `/workspaces/${board.workspaceId}/boards/${board.id}/columns/${colId}`
    );
    onRefreshBoard();
  }

  return (
    <>
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className="space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const groupItems = groupedItems[group.id] || [];

        return (
          <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors group/header">
              <button onClick={() => toggleGroup(group.id)} className="text-gray-400">
                <ChevronDown
                  size={16}
                  className={clsx('transition-transform', isCollapsed && '-rotate-90')}
                />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setColorPickerGroupId(colorPickerGroupId === group.id ? null : group.id); }}
                className="w-3 h-3 rounded-sm flex-shrink-0 hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all"
                style={{ backgroundColor: group.color || '#6366f1' }}
                title="Change color"
              />
              {editingGroupId === group.id ? (
                <input
                  autoFocus
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onBlur={handleFinishGroupRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishGroupRename();
                    if (e.key === 'Escape') setEditingGroupId(null);
                  }}
                  className="border border-blue-400 rounded px-1 py-0.5 text-sm font-semibold text-gray-900 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="font-semibold text-sm text-gray-900 cursor-pointer hover:underline"
                  onClick={() => handleStartGroupRename(group.id)}
                >
                  {group.name}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-1">
                {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => handleDeleteGroup(group.id)}
                className="ml-auto text-gray-300 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-all"
                title="Delete group"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {/* Color Picker Dropdown */}
            {colorPickerGroupId === group.id && (
              <div className="mx-4 mb-2">
                <ColorPicker
                  selectedColor={group.color || '#6366f1'}
                  onChange={(color) => handleGroupColorChange(group.id, color)}
                />
              </div>
            )}

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
                          className="text-left font-medium text-gray-500 px-4 py-2 bg-gray-50 cursor-context-menu select-none"
                          style={{ minWidth: col.width || 150 }}
                          onContextMenu={(e) => handleColumnContextMenu(e, col.id)}
                        >
                          {editingColumnId === col.id ? (
                            <input
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleFinishRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFinishRename();
                                if (e.key === 'Escape') setEditingColumnId(null);
                              }}
                              className="border border-blue-400 rounded px-1 py-0.5 text-sm font-medium text-gray-900 outline-none w-full"
                            />
                          ) : (
                            col.name
                          )}
                        </th>
                      ))}
                      {/* Add Column Button */}
                      <th className="bg-gray-50 px-2 py-2 w-10">
                        <button
                          onClick={() => setShowColumnTypePicker(true)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Add column"
                        >
                          <Plus size={16} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <Droppable droppableId={`group-${group.id}`} type="ITEM">
                    {(provided, snapshot) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {groupItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={sortedColumns.length + 2}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          No items in this group
                        </td>
                      </tr>
                    ) : (
                      groupItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                          {(dragProvided, dragSnapshot) => (
                        <tr
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={clsx(
                            'border-t border-gray-50 transition-colors',
                            dragSnapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-blue-50/30'
                          )}
                        >
                          <td
                            className="px-4 py-2.5 font-medium text-gray-900"
                            style={{
                              borderLeft: `3px solid ${group.color || '#6366f1'}`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span {...dragProvided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab">
                                <GripVertical size={14} />
                              </span>
                              {item.name}
                            </div>
                          </td>
                          {sortedColumns.map((col) => (
                            <td
                              key={col.id}
                              className="px-4 py-2.5 text-gray-600"
                            >
                              {getColumnValue(item, col.id)}
                            </td>
                          ))}
                          <td />
                        </tr>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </tbody>
                    )}
                  </Droppable>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Group Button */}
      <button
        onClick={handleAddGroup}
        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-gray-300 hover:border-blue-300 transition-colors w-full"
      >
        <Plus size={16} />
        Add group
      </button>

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No groups in this board yet</p>
        </div>
      )}
    </div>
    </DragDropContext>

      {/* Column Type Picker Modal */}
      {showColumnTypePicker && (
        <ColumnTypePickerModal
          onSelect={handleAddColumn}
          onClose={() => setShowColumnTypePicker(false)}
        />
      )}

      {/* Column Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleStartRename(contextMenu.colId)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            onClick={() => handleDeleteColumn(contextMenu.colId)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </>
  );
}
