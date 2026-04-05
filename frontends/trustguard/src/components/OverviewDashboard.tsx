import { ShieldAlert, FileText, ClipboardCheck, TrendingUp, ShieldCheck, XCircle } from 'lucide-react';
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
  icon: typeof ShieldAlert;
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
  const claimsBoard = boards.find((b) => b.name === 'Claims Pipeline');
  const policyBoard = boards.find((b) => b.name === 'Policy Lifecycle');
  const uwBoard = boards.find((b) => b.name === 'Underwriting Queue');

  const claimsItems = claimsBoard ? allItems[claimsBoard.id] || [] : [];
  const policyItems = policyBoard ? allItems[policyBoard.id] || [] : [];
  const uwItems = uwBoard ? allItems[uwBoard.id] || [] : [];

  const claimsStatusCol = claimsBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const policyStatusCol = policyBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const uwStatusCol = uwBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activePolicies = countByStatus(policyItems, policyStatusCol, 'Active') +
    countByStatus(policyItems, policyStatusCol, 'Renewal Due');
  const openClaims = countByStatus(claimsItems, claimsStatusCol, 'Open') +
    countByStatus(claimsItems, claimsStatusCol, 'Under Review');
  const pendingUnderwriting = countByStatus(uwItems, uwStatusCol, 'Pending') +
    countByStatus(uwItems, uwStatusCol, 'In Review');
  const deniedClaims = countByStatus(claimsItems, claimsStatusCol, 'Denied');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">TrustGuard Insurance — Protecting What Matters Most</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShieldCheck} label="Active Policies" value={activePolicies} color="#1E3A5F" />
        <StatCard icon={ShieldAlert} label="Open Claims" value={openClaims} color="#2D5F8A" />
        <StatCard icon={ClipboardCheck} label="Pending Underwriting" value={pendingUnderwriting} color="#182F4D" />
        <StatCard icon={XCircle} label="Denied Claims" value={deniedClaims} color="#4A90D9" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Claims Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={18} className="text-brand-600" />
            <h3 className="font-semibold">Claims Pipeline</h3>
          </div>
          <div className="space-y-3">
            {['Open', 'Under Review', 'Approved', 'Denied', 'Settled'].map((status) => {
              const count = countByStatus(claimsItems, claimsStatusCol, status);
              const total = claimsItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Open: '#579BFC', 'Under Review': '#FDAB3D', Approved: '#00C875',
                Denied: '#E2445C', Settled: '#C4C4C4',
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

        {/* Policy Lifecycle Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-brand-600" />
            <h3 className="font-semibold">Policy Lifecycle</h3>
          </div>
          <div className="space-y-3">
            {['Draft', 'Active', 'Renewal Due', 'Expired', 'Cancelled'].map((status) => {
              const count = countByStatus(policyItems, policyStatusCol, status);
              const total = policyItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Draft: '#579BFC', Active: '#00C875', 'Renewal Due': '#FDAB3D', Expired: '#C4C4C4', Cancelled: '#E2445C',
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

        {/* Underwriting Queue Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck size={18} className="text-brand-600" />
            <h3 className="font-semibold">Underwriting Queue</h3>
          </div>
          <div className="space-y-3">
            {['Pending', 'In Review', 'Approved', 'Declined', 'Referred'].map((status) => {
              const count = countByStatus(uwItems, uwStatusCol, status);
              const total = uwItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Pending: '#579BFC', 'In Review': '#FDAB3D', Approved: '#00C875', Declined: '#E2445C', Referred: '#9B59B6',
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
            <p className="text-2xl font-bold text-brand-600">{policyItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Policies</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">{claimsItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Claims</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-700">{uwItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Underwriting Items</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-400">12</p>
            <p className="text-xs text-gray-500 mt-1">Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
