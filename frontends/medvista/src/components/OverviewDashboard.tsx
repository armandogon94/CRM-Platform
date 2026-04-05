import { Users, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react';
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
  const patientBoard = boards.find((b) => b.name === 'Patient Pipeline');
  const appointmentBoard = boards.find((b) => b.name === 'Appointment Scheduler');
  const claimsBoard = boards.find((b) => b.name === 'Insurance Claims');

  const patientItems = patientBoard ? allItems[patientBoard.id] || [] : [];
  const appointmentItems = appointmentBoard ? allItems[appointmentBoard.id] || [] : [];
  const claimItems = claimsBoard ? allItems[claimsBoard.id] || [] : [];

  const patientStatusCol = patientBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const apptStatusCol = appointmentBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const claimStatusCol = claimsBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activePatients = countByStatus(patientItems, patientStatusCol, 'Active');
  const upcomingAppts = countByStatus(appointmentItems, apptStatusCol, 'Scheduled') +
    countByStatus(appointmentItems, apptStatusCol, 'Confirmed');
  const pendingClaims = countByStatus(claimItems, claimStatusCol, 'Submitted') +
    countByStatus(claimItems, claimStatusCol, 'Under Review');
  const deniedClaims = countByStatus(claimItems, claimStatusCol, 'Denied');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">MedVista Multi-Specialty Medical Group</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Patients" value={activePatients} color="#059669" />
        <StatCard icon={Calendar} label="Upcoming Appointments" value={upcomingAppts} color="#2563EB" />
        <StatCard icon={FileText} label="Pending Claims" value={pendingClaims} color="#D97706" />
        <StatCard icon={AlertCircle} label="Denied Claims" value={deniedClaims} color="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patient Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Patient Pipeline</h3>
          </div>
          <div className="space-y-3">
            {['New', 'Intake', 'Active', 'Discharged'].map((status) => {
              const count = countByStatus(patientItems, patientStatusCol, status);
              const total = patientItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                New: '#94A3B8', Intake: '#FCD34D', Active: '#34D399', Discharged: '#6B7280',
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

        {/* Appointment Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-semibold">Appointments</h3>
          </div>
          <div className="space-y-3">
            {['Scheduled', 'Confirmed', 'Completed', 'No-Show', 'Cancelled'].map((status) => {
              const count = countByStatus(appointmentItems, apptStatusCol, status);
              const total = appointmentItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Scheduled: '#60A5FA', Confirmed: '#A78BFA', Completed: '#34D399',
                'No-Show': '#F87171', Cancelled: '#6B7280',
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

        {/* Claims Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-amber-600" />
            <h3 className="font-semibold">Insurance Claims</h3>
          </div>
          <div className="space-y-3">
            {['Submitted', 'Under Review', 'Approved', 'Denied', 'Paid'].map((status) => {
              const count = countByStatus(claimItems, claimStatusCol, status);
              const total = claimItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Submitted: '#60A5FA', 'Under Review': '#FCD34D', Approved: '#34D399',
                Denied: '#F87171', Paid: '#059669',
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
            <p className="text-2xl font-bold text-brand-600">{patientItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Patients</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{appointmentItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Appointments</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{claimItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Claims</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">12</p>
            <p className="text-xs text-gray-500 mt-1">Providers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
