import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Type,
  Hash,
  Calendar,
  User,
  Mail,
  Phone,
  Link,
  CheckSquare,
  List,
  Star,
  FileText,
  Clock,
  Paperclip,
  Calculator,
  AlignLeft,
} from 'lucide-react';
import type { Board, BoardGroup, Column, Item, ColumnValue } from '../../types/index';
import { ColumnRenderer } from './ColumnRenderer';
import { ColumnEditor } from './ColumnEditor';

interface TableViewProps {
  board: Board;
  items: Item[];
  onItemUpdate?: (itemId: number, columnId: number, value: any) => void;
  onItemCreate?: (groupId: number, name: string) => void;
  onItemDelete?: (itemId: number) => void;
}

const columnTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  long_text: AlignLeft,
  number: Hash,
  date: Calendar,
  person: User,
  email: Mail,
  phone: Phone,
  url: Link,
  checkbox: CheckSquare,
  status: List,
  dropdown: List,
  rating: Star,
  files: Paperclip,
  formula: Calculator,
  timeline: Clock,
};

function getValueForColumn(item: Item, columnId: number): any {
  const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === columnId);
  return cv?.value ?? null;
}

interface EditingCell {
  itemId: number;
  columnId: number;
}

function GroupSection({
  group,
  columns,
  items,
  editingCell,
  onCellClick,
  onCellChange,
  onCellBlur,
  onItemCreate,
}: {
  group: BoardGroup;
  columns: Column[];
  items: Item[];
  editingCell: EditingCell | null;
  onCellClick: (itemId: number, columnId: number) => void;
  onCellChange: (itemId: number, columnId: number, value: any) => void;
  onCellBlur: () => void;
  onItemCreate?: (groupId: number, name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const groupItems = items.filter((i) => i.groupId === group.id);

  function handleAddItem() {
    if (!newItemName.trim() || !onItemCreate) return;
    onItemCreate(group.id, newItemName.trim());
    setNewItemName('');
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors w-full group"
      >
        {collapsed ? (
          <ChevronRight size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
        <span
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <span className="font-semibold text-sm" style={{ color: group.color }}>
          {group.name}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
        </span>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto ml-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th
                  className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-10 min-w-[220px] border-b border-gray-200"
                  style={{ borderLeft: `3px solid ${group.color}` }}
                >
                  Item
                </th>
                {columns.map((col) => {
                  const Icon = columnTypeIcons[col.columnType] || FileText;
                  return (
                    <th
                      key={col.id}
                      className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 whitespace-nowrap"
                      style={{ minWidth: col.width || 140 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-gray-400" />
                        {col.name}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors group/row"
                >
                  <td
                    className="py-2.5 px-3 text-sm font-medium text-gray-900 bg-white sticky left-0 z-10 group-hover/row:bg-blue-50/30"
                    style={{ borderLeft: `3px solid ${group.color}` }}
                  >
                    {item.name}
                  </td>
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.itemId === item.id && editingCell?.columnId === col.id;
                    const cellValue = getValueForColumn(item, col.id);

                    return (
                      <td
                        key={col.id}
                        className={`py-2.5 px-3 ${
                          isEditing ? '' : 'cursor-pointer hover:bg-blue-50/50'
                        }`}
                        onClick={() => {
                          if (!isEditing && col.columnType !== 'formula') {
                            onCellClick(item.id, col.id);
                          }
                        }}
                      >
                        {isEditing ? (
                          <ColumnEditor
                            column={col}
                            value={cellValue}
                            onChange={(newValue) => onCellChange(item.id, col.id, newValue)}
                            onBlur={onCellBlur}
                          />
                        ) : (
                          <ColumnRenderer column={col} value={cellValue} compact />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {onItemCreate && (
                <tr className="border-b border-gray-100">
                  <td
                    colSpan={columns.length + 1}
                    className="py-1.5 px-3"
                    style={{ borderLeft: '3px solid transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={14} className="text-gray-400" />
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem();
                        }}
                        placeholder="+ Add item"
                        className="text-sm text-gray-500 outline-none bg-transparent flex-1 placeholder-gray-400"
                      />
                      {newItemName.trim() && (
                        <button
                          onClick={handleAddItem}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {groupItems.length === 0 && !onItemCreate && (
            <p className="text-sm text-gray-400 py-4 px-3">No items in this group</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TableView({ board, items, onItemUpdate, onItemCreate, onItemDelete }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const columns = (board.columns || []).sort((a, b) => a.position - b.position);
  const groups = (board.groups || []).sort((a, b) => a.position - b.position);

  const handleCellClick = useCallback((itemId: number, columnId: number) => {
    setEditingCell({ itemId, columnId });
  }, []);

  const handleCellChange = useCallback(
    (itemId: number, columnId: number, value: any) => {
      onItemUpdate?.(itemId, columnId, value);
    },
    [onItemUpdate]
  );

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No groups configured for this board.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          columns={columns}
          items={items}
          editingCell={editingCell}
          onCellClick={handleCellClick}
          onCellChange={handleCellChange}
          onCellBlur={handleCellBlur}
          onItemCreate={onItemCreate}
        />
      ))}
    </div>
  );
}
