import { Briefcase, UserPlus, Receipt, TrendingUp, AlertCircle, Scale } from 'lucide-react';
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

function sumByColumn(items: Item[], columnId: number | undefined): number {
  if (!columnId) return 0;
  return items.reduce((total, item) => {
    const cv = item.columnValues?.find((v: ColumnValue) => v.columnId === columnId);
    const val = cv?.value;
    return total + (typeof val === 'number' ? val : 0);
  }, 0);
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Briefcase;
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
  const caseBoard = boards.find((b) => b.name === 'Case Management');
  const intakeBoard = boards.find((b) => b.name === 'Client Intake');
  const billingBoard = boards.find((b) => b.name === 'Billing Tracker');

  const caseItems = caseBoard ? allItems[caseBoard.id] || [] : [];
  const intakeItems = intakeBoard ? allItems[intakeBoard.id] || [] : [];
  const billingItems = billingBoard ? allItems[billingBoard.id] || [] : [];

  const caseStatusCol = caseBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const intakeStatusCol = intakeBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const billingStatusCol = billingBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const amountCol = billingBoard?.columns?.find((c) => c.name === 'Amount')?.id;

  const activeCases = caseItems.length - countByStatus(caseItems, caseStatusCol, 'Closed');
  const engagedClients = countByStatus(intakeItems, intakeStatusCol, 'Engaged');
  const overdueInvoices = countByStatus(billingItems, billingStatusCol, 'Overdue');
  const totalBilled = sumByColumn(billingItems, amountCol);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">JurisPath Legal Services CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Cases" value={activeCases} color="#166534" />
        <StatCard icon={UserPlus} label="Engaged Clients" value={engagedClients} color="#2563EB" />
        <StatCard icon={AlertCircle} label="Overdue Invoices" value={overdueInvoices} color="#DC2626" />
        <StatCard icon={Receipt} label="Total Billed" value={`$${totalBilled.toLocaleString()}`} color="#D97706" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Case Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-brand-600" />
            <h3 className="font-semibold">Case Pipeline</h3>
          </div>
          <div className="space-y-3">
            {['Intake', 'Discovery', 'Motions', 'Trial', 'Closed'].map((status) => {
              const count = countByStatus(caseItems, caseStatusCol, status);
              const total = caseItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Intake: '#94A3B8', Discovery: '#60A5FA', Motions: '#A78BFA',
                Trial: '#FB923C', Closed: '#34D399',
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

        {/* Client Intake Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-blue-600" />
            <h3 className="font-semibold">Client Intake</h3>
          </div>
          <div className="space-y-3">
            {['Inquiry', 'Consultation', 'Engaged', 'Completed'].map((status) => {
              const count = countByStatus(intakeItems, intakeStatusCol, status);
              const total = intakeItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Inquiry: '#94A3B8', Consultation: '#FCD34D', Engaged: '#34D399',
                Completed: '#60A5FA',
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

        {/* Billing Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-amber-600" />
            <h3 className="font-semibold">Billing Tracker</h3>
          </div>
          <div className="space-y-3">
            {['Draft', 'Sent', 'Paid', 'Overdue'].map((status) => {
              const count = countByStatus(billingItems, billingStatusCol, status);
              const total = billingItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Draft: '#94A3B8', Sent: '#60A5FA', Paid: '#34D399', Overdue: '#F87171',
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

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-600">{caseItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Cases</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{intakeItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Clients</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{billingItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Invoices</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">25</p>
            <p className="text-xs text-gray-500 mt-1">Attorneys</p>
          </div>
        </div>
      </div>
    </div>
  );
}
