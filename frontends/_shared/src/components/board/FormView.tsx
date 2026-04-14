import React, { useState } from 'react';
import type { Board, Column } from '../../types/index';
import { ColumnEditor } from './ColumnEditor';

interface FormViewProps {
  board: Board;
  onSubmit: (name: string, values: Record<number, any>) => void;
}

export const FormView: React.FC<FormViewProps> = ({ board, onSubmit }) => {
  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (columnId: number, value: any) => {
    setValues((prev) => ({ ...prev, [columnId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, values);
    setName('');
    setValues({});
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const columns = [...board.columns].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-6">Add New Item</h2>

        {submitted && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Item created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item name..."
              required
            />
          </div>

          {columns.map((column: Column) => (
            <div key={column.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {column.name}
                {column.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <ColumnEditor
                column={column}
                value={values[column.id] ?? null}
                onChange={(val) => handleChange(column.id, val)}
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-2 px-4 text-white rounded-lg hover:opacity-90 font-medium"
            style={{ backgroundColor: 'var(--brand-primary, #2563EB)' }}
          >
            Create Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormView;
