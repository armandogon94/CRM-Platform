import { HardHat, Truck, Users, ShieldCheck, TrendingUp, AlertTriangle, DollarSign, Wrench } from 'lucide-react';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
}

function countByStatus(items: Item[], statusColumnId: number | undefined, label: string): number {
  if (!statusColumnId) return 0;
  return items.filter((item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === statusColumnId);
    const val = cv?.value as { label: string } | null;
    return val?.label === label;
  }).length;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof HardHat;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function OverviewDashboard({ boards, allItems }: OverviewDashboardProps) {
  const projectBoard = boards.find((b) => b.name === 'Project Pipeline');
  const equipBoard = boards.find((b) => b.name === 'Equipment Tracker');
  const subBoard = boards.find((b) => b.name === 'Subcontractor Board');
  const safetyBoard = boards.find((b) => b.name === 'Safety Compliance');

  const projectItems = projectBoard ? allItems[projectBoard.id] || [] : [];
  const equipItems = equipBoard ? allItems[equipBoard.id] || [] : [];
  const subItems = subBoard ? allItems[subBoard.id] || [] : [];
  const safetyItems = safetyBoard ? allItems[safetyBoard.id] || [] : [];

  const projStatusCol = projectBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const equipStatusCol = equipBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const subStatusCol = subBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const safetyStatusCol = safetyBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activeProjects = countByStatus(projectItems, projStatusCol, 'in_progress');
  const equipInService = countByStatus(equipItems, equipStatusCol, 'in_service');
  const activeSubs = countByStatus(subItems, subStatusCol, 'active');
  const openIncidents = countByStatus(safetyItems, safetyStatusCol, 'open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">CraneStack Construction — Build Smarter. Deliver Faster.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HardHat} label="Active Projects" value={activeProjects} color="#EA580C" />
        <StatCard icon={Truck} label="Equipment In Service" value={equipInService} color="#2563EB" />
        <StatCard icon={Users} label="Active Subcontractors" value={activeSubs} color="#16A34A" />
        <StatCard icon={AlertTriangle} label="Open Incidents" value={openIncidents} color="#DC2626" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardHat size={18} className="text-brand-600" />
            <h3 className="font-semibold">Project Pipeline</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Bid', id: 'bid', color: '#6366F1' },
              { label: 'Pre-Construction', id: 'pre_construction', color: '#F59E0B' },
              { label: 'In Progress', id: 'in_progress', color: '#EA580C' },
              { label: 'Punch List', id: 'punch_list', color: '#8B5CF6' },
              { label: 'Closeout', id: 'closeout', color: '#10B981' },
            ].map((status) => {
              const count = countByStatus(projectItems, projStatusCol, status.id);
              const total = projectItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipment Tracker Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-blue-600" />
            <h3 className="font-semibold">Equipment Tracker</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Available', id: 'available', color: '#10B981' },
              { label: 'In Service', id: 'in_service', color: '#3B82F6' },
              { label: 'Maintenance', id: 'maintenance', color: '#F59E0B' },
              { label: 'Retired', id: 'retired', color: '#6B7280' },
            ].map((status) => {
              const count = countByStatus(equipItems, equipStatusCol, status.id);
              const total = equipItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subcontractor Board Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-green-600" />
            <h3 className="font-semibold">Subcontractors</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Active', id: 'active', color: '#10B981' },
              { label: 'Pending Approval', id: 'pending', color: '#F59E0B' },
              { label: 'Inactive', id: 'inactive', color: '#6B7280' },
            ].map((status) => {
              const count = countByStatus(subItems, subStatusCol, status.id);
              const total = subItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Compliance Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-red-600" />
            <h3 className="font-semibold">Safety Compliance</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Passed', id: 'passed', color: '#10B981' },
              { label: 'Failed', id: 'failed', color: '#DC2626' },
              { label: 'Pending', id: 'pending', color: '#F59E0B' },
              { label: 'Open Incidents', id: 'open', color: '#EA580C' },
              { label: 'Resolved', id: 'resolved', color: '#3B82F6' },
              { label: 'Completed', id: 'completed', color: '#10B981' },
            ].map((status) => {
              const count = countByStatus(safetyItems, safetyStatusCol, status.id);
              const total = safetyItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-600">{projectItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Projects</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{equipItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Equipment Units</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{subItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Subcontractors</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{safetyItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Safety Records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
