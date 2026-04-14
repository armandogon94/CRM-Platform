import React from 'react';
import { Plus, X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import type { Column } from '../../types/index';

export interface SortRule {
  columnId: number;
  direction: 'ASC' | 'DESC';
}

interface SortPanelProps {
  columns: Column[];
  sorts: SortRule[];
  onChange: (sorts: SortRule[]) => void;
}

export function SortPanel({ columns, sorts, onChange }: SortPanelProps) {
  function handleAddSort() {
    const usedColumnIds = new Set(sorts.map((s) => s.columnId));
    const availableColumn = columns.find((c) => !usedColumnIds.has(c.id));
    if (!availableColumn) return;
    onChange([...sorts, { columnId: availableColumn.id, direction: 'ASC' }]);
  }

  function handleRemoveSort(index: number) {
    onChange(sorts.filter((_, i) => i !== index));
  }

  function handleUpdateSort(index: number, field: 'columnId' | 'direction', value: any) {
    const updated = sorts.map((sort, i) => {
      if (i !== index) return sort;
      return { ...sort, [field]: field === 'columnId' ? Number(value) : value };
    });
    onChange(updated);
  }

  function handleMoveSort(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorts.length) return;
    const updated = [...sorts];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
  }

  const usedColumnIds = new Set(sorts.map((s) => s.columnId));
  const hasAvailableColumns = columns.some((c) => !usedColumnIds.has(c.id));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <ArrowUp size={14} />
          Sort
        </div>
        {sorts.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {sorts.length > 0 && (
        <div className="space-y-2">
          {sorts.map((sort, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveSort(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  onClick={() => handleMoveSort(index, 'down')}
                  disabled={index === sorts.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={10} />
                </button>
              </div>
              <GripVertical size={14} className="text-gray-300" />

              <select
                value={sort.columnId}
                onChange={(e) => handleUpdateSort(index, 'columnId', e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none flex-1"
              >
                {columns.map((col) => (
                  <option
                    key={col.id}
                    value={col.id}
                    disabled={usedColumnIds.has(col.id) && col.id !== sort.columnId}
                  >
                    {col.name}
                  </option>
                ))}
              </select>

              <select
                value={sort.direction}
                onChange={(e) => handleUpdateSort(index, 'direction', e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>

              <button
                onClick={() => handleRemoveSort(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {hasAvailableColumns && (
        <button
          onClick={handleAddSort}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Plus size={14} />
          Add sort
        </button>
      )}
    </div>
  );
}
