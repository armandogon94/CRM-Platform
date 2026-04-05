import { CreditCard, Building2, ShieldCheck, TrendingUp, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
}

function countByColumnValue(items: Item[], columnName: string, columns: Board['columns'], value: string): number {
  const col = columns?.find((c) => c.name === columnName);
  if (!col) return 0;
  return items.filter((item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === col.id);
    return cv?.value === value;
  }).length;
}

function sumByColumn(items: Item[], columnName: string, columns: Board['columns']): number {
  const col = columns?.find((c) => c.name === columnName);
  if (!col) return 0;
  return items.reduce((sum, item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === col.id);
    const val = Number(cv?.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
}

function avgByColumn(items: Item[], columnName: string, columns: Board['columns']): number {
  const col = columns?.find((c) => c.name === columnName);
  if (!col || items.length === 0) return 0;
  const sum = items.reduce((total, item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === col.id);
    const val = Number(cv?.value);
    return total + (isNaN(val) ? 0 : val);
  }, 0);
  return Math.round(sum / items.length);
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: typeof CreditCard;
  label: string;
  value: string | number;
  subtext?: string;
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
          {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

export function OverviewDashboard({ boards, allItems }: OverviewDashboardProps) {
  const txnBoard = boards.find((b) => b.name === 'Transaction Pipeline');
  const merchantBoard = boards.find((b) => b.name === 'Merchant Onboarding');
  const complianceBoard = boards.find((b) => b.name === 'Compliance & Regulatory');

  const txnItems = txnBoard ? allItems[txnBoard.id] || [] : [];
  const merchantItems = merchantBoard ? allItems[merchantBoard.id] || [] : [];
  const complianceItems = complianceBoard ? allItems[complianceBoard.id] || [] : [];

  // Transaction KPIs
  const totalVolume = sumByColumn(txnItems, 'Amount', txnBoard?.columns);
  const settledCount = countByColumnValue(txnItems, 'Status', txnBoard?.columns, 'Settled');
  const disputedCount = countByColumnValue(txnItems, 'Status', txnBoard?.columns, 'Disputed');
  const failedCount = countByColumnValue(txnItems, 'Status', txnBoard?.columns, 'Failed');
  const avgRiskScore = avgByColumn(txnItems, 'Risk Score', txnBoard?.columns);
  const fraudRate = txnItems.length > 0 ? ((disputedCount / txnItems.length) * 100).toFixed(1) : '0';

  // Merchant KPIs
  const activeMerchants = countByColumnValue(merchantItems, 'Application Status', merchantBoard?.columns, 'API Active');
  const pendingKyc = countByColumnValue(merchantItems, 'Application Status', merchantBoard?.columns, 'KYC In Progress')
    + countByColumnValue(merchantItems, 'Application Status', merchantBoard?.columns, 'Submitted');

  // Compliance KPIs
  const overdueCompliance = countByColumnValue(complianceItems, 'Status', complianceBoard?.columns, 'Overdue');
  const inProgressCompliance = countByColumnValue(complianceItems, 'Status', complianceBoard?.columns, 'In Progress');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">NovaPay Digital Payment Processing</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Transaction Volume"
          value={`$${(totalVolume / 1000).toFixed(0)}K`}
          subtext={`${txnItems.length} transactions`}
          color="#2563EB"
        />
        <StatCard
          icon={CheckCircle}
          label="Settlement Rate"
          value={txnItems.length > 0 ? `${((settledCount / txnItems.length) * 100).toFixed(0)}%` : '0%'}
          subtext={`${settledCount} settled`}
          color="#059669"
        />
        <StatCard
          icon={AlertTriangle}
          label="Fraud Rate"
          value={`${fraudRate}%`}
          subtext={`${disputedCount} disputed, ${failedCount} failed`}
          color="#DC2626"
        />
        <StatCard
          icon={Building2}
          label="Active Merchants"
          value={activeMerchants}
          subtext={`${pendingKyc} pending verification`}
          color="#7C3AED"
        />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transaction Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-brand-600" />
            <h3 className="font-semibold">Transaction Pipeline</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Settled', color: '#34D399' },
              { label: 'Processing', color: '#60A5FA' },
              { label: 'Pending', color: '#FCD34D' },
              { label: 'Failed', color: '#F87171' },
              { label: 'Disputed', color: '#FB923C' },
            ].map((status) => {
              const count = countByColumnValue(txnItems, 'Status', txnBoard?.columns, status.label);
              const total = txnItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.label}>
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

        {/* Merchant Onboarding Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-indigo-600" />
            <h3 className="font-semibold">Merchant Onboarding</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'API Active', color: '#34D399' },
              { label: 'Contract Signed', color: '#A78BFA' },
              { label: 'KYC Verified', color: '#60A5FA' },
              { label: 'KYC In Progress', color: '#FCD34D' },
              { label: 'Submitted', color: '#94A3B8' },
              { label: 'Rejected', color: '#F87171' },
            ].map((status) => {
              const count = countByColumnValue(merchantItems, 'Application Status', merchantBoard?.columns, status.label);
              const total = merchantItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.label}>
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

        {/* Compliance Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="font-semibold">Compliance & Regulatory</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Complete', color: '#34D399' },
              { label: 'In Progress', color: '#FCD34D' },
              { label: 'Pending', color: '#94A3B8' },
              { label: 'Overdue', color: '#F87171' },
            ].map((status) => {
              const count = countByColumnValue(complianceItems, 'Status', complianceBoard?.columns, status.label);
              const total = complianceItems.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status.label}>
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

      {/* Bottom Stats */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-600">{txnItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Transactions</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{merchantItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Merchants</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{complianceItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Compliance Cases</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{avgRiskScore}</p>
            <p className="text-xs text-gray-500 mt-1">Avg Risk Score</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{overdueCompliance + inProgressCompliance}</p>
            <p className="text-xs text-gray-500 mt-1">Active Reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}
