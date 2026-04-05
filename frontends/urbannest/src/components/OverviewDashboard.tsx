import { Users, Home, Calendar, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
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
  icon: typeof Users;
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
  const leadBoard = boards.find((b) => b.name === 'Lead Pipeline');
  const propertyBoard = boards.find((b) => b.name === 'Property Listings');
  const showingBoard = boards.find((b) => b.name === 'Showing Scheduler');

  const leadItems = leadBoard ? allItems[leadBoard.id] || [] : [];
  const propertyItems = propertyBoard ? allItems[propertyBoard.id] || [] : [];
  const showingItems = showingBoard ? allItems[showingBoard.id] || [] : [];

  const leadStatusCol = leadBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const propertyStatusCol = propertyBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const showingStatusCol = showingBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activeLeads = countByStatus(leadItems, leadStatusCol, 'Active') +
    countByStatus(leadItems, leadStatusCol, 'Contacted');
  const listedProperties = countByStatus(propertyItems, propertyStatusCol, 'Active') +
    countByStatus(propertyItems, propertyStatusCol, 'Listed');
  const scheduledShowings = countByStatus(showingItems, showingStatusCol, 'Scheduled') +
    countByStatus(showingItems, showingStatusCol, 'Confirmed');
  const closedDeals = countByStatus(leadItems, leadStatusCol, 'Closed') +
    countByStatus(propertyItems, propertyStatusCol, 'Sold');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">UrbanNest Residential Real Estate — Your Home, Our Mission</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Leads" value={activeLeads} color="#D97706" />
        <StatCard icon={Home} label="Listed Properties" value={listedProperties} color="#B45309" />
        <StatCard icon={Calendar} label="Scheduled Showings" value={scheduledShowings} color="#92400E" />
        <StatCard icon={DollarSign} label="Closed Deals" value={closedDeals} color="#FBBF24" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Lead Pipeline</h3>
          </div>
          <div className="space-y-3">
            {['New', 'Contacted', 'Active', 'Negotiating', 'Closed'].map((status) => {
              const count = countByStatus(leadItems, leadStatusCol, status);
              const total = leadItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                New: '#579BFC', Contacted: '#FDAB3D', Active: '#00C875',
                Negotiating: '#9B59B6', Closed: '#C4C4C4',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Listings Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home size={18} className="text-brand-600" />
            <h3 className="font-semibold">Property Listings</h3>
          </div>
          <div className="space-y-3">
            {['Draft', 'Listed', 'Active', 'Under Contract', 'Sold'].map((status) => {
              const count = countByStatus(propertyItems, propertyStatusCol, status);
              const total = propertyItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Draft: '#579BFC', Listed: '#00C875', Active: '#FDAB3D', 'Under Contract': '#9B59B6', Sold: '#C4C4C4',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Showing Scheduler Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-brand-600" />
            <h3 className="font-semibold">Showing Scheduler</h3>
          </div>
          <div className="space-y-3">
            {['Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((status) => {
              const count = countByStatus(showingItems, showingStatusCol, status);
              const total = showingItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Scheduled: '#579BFC', Confirmed: '#00C875', Completed: '#C4C4C4', Cancelled: '#E2445C',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: colors[status] }}
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
            <p className="text-2xl font-bold text-brand-600">{leadItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Leads</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">{propertyItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Properties</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-800">{showingItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Showings</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">8</p>
            <p className="text-xs text-gray-500 mt-1">Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
