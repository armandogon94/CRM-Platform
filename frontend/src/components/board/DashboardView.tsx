import { useState, useEffect } from 'react';
import { BarChart3, Hash, Layers } from 'lucide-react';
import api from '@/utils/api';
import { ActivityFeed } from './ActivityFeed';
import type { Board } from '@/types';

interface Aggregates {
  totalItems: number;
  statusCounts: Record<string, number>;
  itemsByGroup: Record<number, number>;
}

interface DashboardViewProps {
  board: Board;
}

const STATUS_COLORS: Record<string, string> = {
  'Done': '#00c875',
  'Working on it': '#fdab3d',
  'Stuck': '#e2445c',
  'Not started': '#c4c4c4',
};

function getStatusColor(label: string): string {
  return STATUS_COLORS[label] || '#6366f1';
}

export function DashboardView({ board }: DashboardViewProps) {
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAggregates() {
      setLoading(true);
      try {
        const res = await api.get(`/boards/${board.id}/aggregates`);
        if (!cancelled && res.success) {
          setAggregates(res.data);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAggregates();
    return () => { cancelled = true; };
  }, [board.id]);

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!aggregates) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Failed to load dashboard data</p>
      </div>
    );
  }

  const groups = board.groups || [];

  return (
    <div data-testid="dashboard-grid" className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{aggregates.totalItems}</p>
        </div>

        {/* Status KPI Cards */}
        {Object.entries(aggregates.statusCounts).map(([label, count]) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStatusColor(label) }}
              />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Second Row: Groups Summary + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Items by Group */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900">Items by Group</h3>
          </div>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => {
                const count = aggregates.itemsByGroup[group.id] || 0;
                const maxCount = Math.max(...Object.values(aggregates.itemsByGroup), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={group.id} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color || '#6366f1' }}
                    />
                    <span className="text-sm text-gray-700 w-24 truncate">{group.name}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: group.color || '#6366f1',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No groups</p>
          )}
        </div>

        {/* Activity Widget */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <ActivityFeed boardId={board.id} />
        </div>
      </div>
    </div>
  );
}
