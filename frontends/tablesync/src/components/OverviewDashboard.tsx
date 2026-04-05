import { CalendarClock, UtensilsCrossed, Users, TrendingUp, ClipboardList, AlertTriangle } from 'lucide-react';
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
  const reservationBoard = boards.find((b) => b.name === 'Reservation Board');
  const menuBoard = boards.find((b) => b.name === 'Menu Management');
  const staffBoard = boards.find((b) => b.name === 'Staff Schedule');

  const reservationItems = reservationBoard ? allItems[reservationBoard.id] || [] : [];
  const menuItems = menuBoard ? allItems[menuBoard.id] || [] : [];
  const staffItems = staffBoard ? allItems[staffBoard.id] || [] : [];

  const reservationStatusCol = reservationBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const menuStatusCol = menuBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const staffStatusCol = staffBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const confirmedReservations = countByStatus(reservationItems, reservationStatusCol, 'Confirmed') +
    countByStatus(reservationItems, reservationStatusCol, 'Scheduled');
  const activeMenuItems = countByStatus(menuItems, menuStatusCol, 'Active') +
    countByStatus(menuItems, menuStatusCol, 'Available');
  const onDutyStaff = countByStatus(staffItems, staffStatusCol, 'On Duty') +
    countByStatus(staffItems, staffStatusCol, 'Scheduled');
  const pendingReservations = countByStatus(reservationItems, reservationStatusCol, 'Pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">TableSync Restaurant — Fine Dining Excellence</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarClock} label="Confirmed Reservations" value={confirmedReservations} color="#9F1239" />
        <StatCard icon={UtensilsCrossed} label="Active Menu Items" value={activeMenuItems} color="#BE123C" />
        <StatCard icon={Users} label="On Duty Staff" value={onDutyStaff} color="#E11D48" />
        <StatCard icon={ClipboardList} label="Pending Reservations" value={pendingReservations} color="#FB7185" />
      </div>

      {/* Board Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reservation Board Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={18} className="text-brand-600" />
            <h3 className="font-semibold">Reservation Board</h3>
          </div>
          <div className="space-y-3">
            {['Pending', 'Confirmed', 'Scheduled', 'Seated', 'Completed', 'Cancelled'].map((status) => {
              const count = countByStatus(reservationItems, reservationStatusCol, status);
              const total = reservationItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Pending: '#579BFC', Confirmed: '#00C875', Scheduled: '#FDAB3D',
                Seated: '#9B59B6', Completed: '#C4C4C4', Cancelled: '#E2445C',
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

        {/* Menu Management Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={18} className="text-brand-600" />
            <h3 className="font-semibold">Menu Management</h3>
          </div>
          <div className="space-y-3">
            {['Active', 'Available', 'Seasonal', 'Unavailable'].map((status) => {
              const count = countByStatus(menuItems, menuStatusCol, status);
              const total = menuItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Active: '#00C875', Available: '#579BFC', Seasonal: '#FDAB3D', Unavailable: '#E2445C',
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

        {/* Staff Schedule Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Staff Schedule</h3>
          </div>
          <div className="space-y-3">
            {['Scheduled', 'On Duty', 'Off Duty', 'On Leave'].map((status) => {
              const count = countByStatus(staffItems, staffStatusCol, status);
              const total = staffItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Scheduled: '#579BFC', 'On Duty': '#00C875', 'Off Duty': '#C4C4C4', 'On Leave': '#FDAB3D',
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
            <p className="text-2xl font-bold text-brand-600">{reservationItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Reservations</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-700">{menuItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Menu Items</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-800">{staffItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Staff Members</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">12</p>
            <p className="text-xs text-gray-500 mt-1">Tables</p>
          </div>
        </div>
      </div>
    </div>
  );
}
