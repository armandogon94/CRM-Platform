import React, { useState } from 'react';
import { Plus, X, Filter } from 'lucide-react';
import type { Column } from '../../types';

export interface FilterItem {
  columnId: number;
  operator: string;
  value: any;
}

interface FilterPanelProps {
  columns: Column[];
  filters: FilterItem[];
  onChange: (filters: FilterItem[]) => void;
}

const operatorsByType: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  long_text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_or_equal', label: 'Greater or equal' },
    { value: 'less_or_equal', label: 'Less or equal' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  status: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  dropdown: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  date: [
    { value: 'equals', label: 'Is' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  person: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  checkbox: [
    { value: 'equals', label: 'Is' },
  ],
  email: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  phone: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  rating: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
  ],
};

function getOperators(columnType: string) {
  return operatorsByType[columnType] || operatorsByType.text;
}

function needsValue(operator: string): boolean {
  return !['is_empty', 'is_not_empty'].includes(operator);
}

export function FilterPanel({ columns, filters, onChange }: FilterPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newColumnId, setNewColumnId] = useState<number | null>(null);
  const [newOperator, setNewOperator] = useState('');
  const [newValue, setNewValue] = useState<any>('');

  const selectedColumn = columns.find((c) => c.id === newColumnId);
  const operators = selectedColumn ? getOperators(selectedColumn.columnType) : [];

  function handleAddFilter() {
    if (newColumnId === null || !newOperator) return;
    if (needsValue(newOperator) && (newValue === '' || newValue === null || newValue === undefined)) return;

    const filter: FilterItem = {
      columnId: newColumnId,
      operator: newOperator,
      value: needsValue(newOperator) ? newValue : null,
    };
    onChange([...filters, filter]);
    resetForm();
  }

  function handleRemoveFilter(index: number) {
    const updated = filters.filter((_, i) => i !== index);
    onChange(updated);
  }

  function resetForm() {
    setIsAdding(false);
    setNewColumnId(null);
    setNewOperator('');
    setNewValue('');
  }

  function getColumnName(columnId: number): string {
    return columns.find((c) => c.id === columnId)?.name || 'Unknown';
  }

  function getOperatorLabel(columnId: number, operator: string): string {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return operator;
    const ops = getOperators(col.columnType);
    return ops.find((o) => o.value === operator)?.label || operator;
  }

  function renderValueInput() {
    if (!selectedColumn || !needsValue(newOperator)) return null;

    switch (selectedColumn.columnType) {
      case 'number':
      case 'rating':
        return (
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-32"
            placeholder="Value"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        );
      case 'checkbox':
        return (
          <select
            value={newValue}
            onChange={(e) => setNewValue(e.target.value === 'true')}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select...</option>
            <option value="true">Checked</option>
            <option value="false">Unchecked</option>
          </select>
        );
      case 'status':
      case 'dropdown': {
        const options = (selectedColumn.config as { options?: { label: string }[] })?.options || [];
        return (
          <select
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }
      default:
        return (
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-40"
            placeholder="Value"
          />
        );
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter size={14} />
          Filters
        </div>
        {filters.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 text-sm"
            >
              <span className="font-medium text-gray-700">{getColumnName(filter.columnId)}</span>
              <span className="text-gray-400">{getOperatorLabel(filter.columnId, filter.operator)}</span>
              {filter.value !== null && filter.value !== undefined && (
                <span className="text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {String(filter.value)}
                </span>
              )}
              <button
                onClick={() => handleRemoveFilter(index)}
                className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Filter Form */}
      {isAdding ? (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={newColumnId ?? ''}
            onChange={(e) => {
              setNewColumnId(e.target.value ? Number(e.target.value) : null);
              setNewOperator('');
              setNewValue('');
            }}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select column...</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>

          {newColumnId !== null && (
            <select
              value={newOperator}
              onChange={(e) => setNewOperator(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Condition...</option>
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          )}

          {newOperator && renderValueInput()}

          <div className="flex items-center gap-1">
            <button
              onClick={handleAddFilter}
              disabled={!newColumnId || !newOperator}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
            <button
              onClick={resetForm}
              className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Plus size={14} />
          Add filter
        </button>
      )}
    </div>
  );
}
