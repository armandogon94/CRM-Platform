import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import type { Board, BoardGroup, Column, Item, ColumnValue } from '../types';

interface BoardTableProps {
  board: Board;
  items: Item[];
}

function getValueForColumn(item: Item, columnId: number): unknown {
  const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === columnId);
  return cv?.value ?? null;
}

function renderCellValue(column: Column, value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-300">-</span>;
  }

  switch (column.columnType) {
    case 'status': {
      const v = value as { label: string; color: string };
      return <StatusBadge label={v.label} color={v.color} />;
    }
    case 'dropdown': {
      const v = value as { label: string; color: string };
      return <StatusBadge label={v.label} color={v.color} />;
    }
    case 'checkbox': {
      return value ? (
        <Check size={16} className="text-brand-600" />
      ) : (
        <X size={16} className="text-gray-400" />
      );
    }
    case 'number': {
      const config = column.config as { format?: string; currency?: string };
      if (config.format === 'currency') {
        return (
          <span className="font-mono text-sm">
            ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
      const suffix = (column.config as { suffix?: string }).suffix;
      return <span className="font-mono text-sm">{String(value)}{suffix ? ` ${suffix}` : ''}</span>;
    }
    case 'date': {
      const d = new Date(String(value));
      const config = column.config as { include_time?: boolean; includeTime?: boolean };
      if (config.include_time || config.includeTime) {
        return (
          <span className="text-sm">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
            <span className="text-gray-500">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </span>
        );
      }
      return <span className="text-sm">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
    }
    case 'person': {
      const v = value as { name: string } | string;
      const name = typeof v === 'string' ? v : v.name;
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-medium">
            {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-sm">{name}</span>
        </div>
      );
    }
    case 'long_text':
      return <span className="text-sm text-gray-600 truncate max-w-[200px] block">{String(value)}</span>;
    case 'email':
      return <span className="text-sm text-brand-600">{String(value)}</span>;
    case 'phone':
      return <span className="text-sm">{String(value)}</span>;
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}

function GroupSection({ group, columns, items }: { group: BoardGroup; columns: Column[]; items: Item[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const groupItems = items.filter((i) => i.groupId === group.id);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors w-full"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        <span
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: group.color }}
        />
        <span className="font-semibold text-sm">{group.name}</span>
        <span className="text-xs text-gray-400 ml-1">({groupItems.length})</span>
      </button>

      {!collapsed && groupItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                  Name
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ minWidth: col.width }}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  {columns.map((col) => (
                    <td key={col.id} className="py-2.5 px-3">
                      {renderCellValue(col, getValueForColumn(item, col.id))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!collapsed && groupItems.length === 0 && (
        <p className="text-sm text-gray-400 py-3 px-3 ml-7">No items in this group</p>
      )}
    </div>
  );
}

export function BoardTable({ board, items }: BoardTableProps) {
  const columns = (board.columns || []).sort((a, b) => a.position - b.position);
  const groups = (board.groups || []).sort((a, b) => a.position - b.position);

  if (groups.length === 0) {
    return <p className="text-gray-500 p-6">No groups configured for this board.</p>;
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          columns={columns}
          items={items}
        />
      ))}
    </div>
  );
}
