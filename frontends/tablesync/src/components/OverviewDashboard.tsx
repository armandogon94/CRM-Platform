import { useState } from 'react';
import { CalendarClock, UtensilsCrossed, Users, TrendingUp, ClipboardList, AlertTriangle, Plus, X } from 'lucide-react';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
  /**
   * Slice 20B C4: parent App refetches its `boards` state on success so
   * the newly-created board immediately appears in the sidebar + KPIs.
   */
  onBoardCreated?: () => void;
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

export function OverviewDashboard({ boards, allItems, onBoardCreated }: OverviewDashboardProps) {
  const { user } = useAuth();
  const { show: showToast } = useToast();

  // Slice 20B C4: RBAC - only admin sees "New Board" per the RBAC matrix.
  // member + viewer get no create affordance (member's no-create-board is
  // a product decision, mirroring NovaPay/MedVista C4).
  const canCreateBoard = user?.role === 'admin';

  // Create-dialog state.
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !user?.workspaceId) return;

    setCreating(true);
    try {
      const res = await api.createBoard({
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || null,
        workspaceId: user.workspaceId,
        boardType: 'main',
      });
      if (res.success) {
        setNewBoardName('');
        setNewBoardDescription('');
        setShowCreateDialog(false);
        onBoardCreated?.();
      } else {
        showToast({
          variant: 'error',
          title: 'Could not create board',
          description: res.error ?? 'Please try again.',
        });
      }
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not create board',
        description: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setCreating(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">TableSync Restaurant — Fine Dining Excellence</p>
        </div>
        {canCreateBoard && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-brand-600 text-white font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 hover:opacity-90"
          >
            <Plus size={18} />
            New Board
          </button>
        )}
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

      {/* Slice 20B C4 Create-board dialog. Role-gated open: only admin can
          reach this via the trigger button above. */}
      {showCreateDialog && canCreateBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Board
              </h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="tablesync-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="tablesync-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Reservation Board"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="tablesync-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="tablesync-new-board-description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors resize-none"
                  placeholder="What is this board for?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newBoardName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg transition-opacity disabled:opacity-50 flex items-center gap-2 hover:opacity-90"
                >
                  {creating && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
