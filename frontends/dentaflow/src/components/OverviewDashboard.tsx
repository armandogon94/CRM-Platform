import { Users, CalendarClock, ClipboardList, TrendingUp, Smile, AlertTriangle } from 'lucide-react';
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
  const apptBoard = boards.find((b) => b.name === 'Appointment Board');
  const txBoard = boards.find((b) => b.name === 'Treatment Plans');

  const patientItems = patientBoard ? allItems[patientBoard.id] || [] : [];
  const apptItems = apptBoard ? allItems[apptBoard.id] || [] : [];
  const txItems = txBoard ? allItems[txBoard.id] || [] : [];

  const patientStatusCol = patientBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const apptStatusCol = apptBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const txStatusCol = txBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activePatients = countByStatus(patientItems, patientStatusCol, 'Active') +
    countByStatus(patientItems, patientStatusCol, 'Treatment');
  const upcomingAppts = countByStatus(apptItems, apptStatusCol, 'Scheduled') +
    countByStatus(apptItems, apptStatusCol, 'Confirmed');
  const activeTreatments = countByStatus(txItems, txStatusCol, 'In Progress');
  const newPatients = countByStatus(patientItems, patientStatusCol, 'New');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">DentaFlow Dental Clinic — Smiles You Can Trust</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Patients" value={activePatients} color="#06B6D4" />
        <StatCard icon={CalendarClock} label="Upcoming Appointments" value={upcomingAppts} color="#0891B2" />
        <StatCard icon={ClipboardList} label="Active Treatments" value={activeTreatments} color="#0E7490" />
        <StatCard icon={Smile} label="New Patients" value={newPatients} color="#22D3EE" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patient Pipeline Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Patient Pipeline</h3>
          </div>
          <div className="space-y-3">
            {['New', 'Intake Complete', 'Active', 'Treatment', 'Complete'].map((status) => {
              const count = countByStatus(patientItems, patientStatusCol, status);
              const total = patientItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                New: '#579BFC', 'Intake Complete': '#FDAB3D', Active: '#00C875',
                Treatment: '#9B59B6', Complete: '#C4C4C4',
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

        {/* Appointment Board Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={18} className="text-brand-600" />
            <h3 className="font-semibold">Appointment Board</h3>
          </div>
          <div className="space-y-3">
            {['Scheduled', 'Confirmed', 'Completed', 'Cancelled'].map((status) => {
              const count = countByStatus(apptItems, apptStatusCol, status);
              const total = apptItems.length || 1;
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

        {/* Treatment Plans Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-brand-600" />
            <h3 className="font-semibold">Treatment Plans</h3>
          </div>
          <div className="space-y-3">
            {['Planned', 'In Progress', 'Complete', 'On Hold'].map((status) => {
              const count = countByStatus(txItems, txStatusCol, status);
              const total = txItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Planned: '#579BFC', 'In Progress': '#FDAB3D', Complete: '#00C875', 'On Hold': '#C4C4C4',
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
            <p className="text-2xl font-bold text-brand-600">{patientItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Patients</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-cyan-700">{apptItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Appointments</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-700">{txItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Treatment Plans</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">6</p>
            <p className="text-xs text-gray-500 mt-1">Dentists</p>
          </div>
        </div>
      </div>
    </div>
  );
}
