import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Board, Item, Column } from '../../types';

interface ChartViewProps {
  board: Board;
  items: Item[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export const ChartView: React.FC<ChartViewProps> = ({ board, items }) => {
  const statusColumn = board.columns.find(c => c.columnType === 'status');

  const chartData = useMemo(() => {
    if (!statusColumn) return [];
    const counts: Record<string, { name: string; count: number; color: string }> = {};
    const labels = statusColumn.config?.labels || [];

    for (const item of items) {
      const cv = item.columnValues?.find(v => v.columnId === statusColumn.id);
      const label = cv?.value?.label || 'No Status';
      const color = cv?.value?.color || '#c4c4c4';
      if (!counts[label]) counts[label] = { name: label, count: 0, color };
      counts[label].count++;
    }

    // Add zero-count labels
    for (const l of labels) {
      if (!counts[l.label]) counts[l.label] = { name: l.label, count: 0, color: l.color };
    }

    return Object.values(counts);
  }, [items, statusColumn]);

  if (!statusColumn) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Add a Status column to use Chart View
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Items by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartView;
