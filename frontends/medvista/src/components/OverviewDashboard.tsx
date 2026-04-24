import { useState } from 'react';
import { Users, Calendar, FileText, TrendingUp, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board, Item, ColumnValue } from '../types';

interface OverviewDashboardProps {
  boards: Board[];
  allItems: Record<number, Item[]>;
  /**
   * Slice 20 C4: parent App refetches its `boards` state on success so
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

  // Slice 20 C4: RBAC — only admin sees "New Board" per the RBAC matrix.
  // member + viewer get no create affordance (member's no-create-board is
  // a product decision, mirroring NovaPay C4).
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">MedVista Multi-Specialty Medical Group</p>
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

      {/* Slice 20 C4 Create-board dialog. Role-gated open: only admin can
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
                  htmlFor="medvista-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="medvista-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Patient Pipeline"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="medvista-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="medvista-new-board-description"
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
