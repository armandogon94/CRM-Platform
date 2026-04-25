import { useState } from 'react';
import { HardHat, Truck, Users, ShieldCheck, TrendingUp, AlertTriangle, Plus, X } from 'lucide-react';
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

  // Slice 20B C4: RBAC — only admin sees "New Board" per the RBAC matrix.
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

  const projectBoard = boards.find((b) => b.name === 'Project Pipeline');
  const equipmentBoard = boards.find((b) => b.name === 'Equipment Tracker');
  const subBoard = boards.find((b) => b.name === 'Subcontractor Board');
  const safetyBoard = boards.find((b) => b.name === 'Safety Compliance');

  const projectItems = projectBoard ? allItems[projectBoard.id] || [] : [];
  const equipmentItems = equipmentBoard ? allItems[equipmentBoard.id] || [] : [];
  const subItems = subBoard ? allItems[subBoard.id] || [] : [];
  const safetyItems = safetyBoard ? allItems[safetyBoard.id] || [] : [];

  const projectStatusCol = projectBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const equipmentStatusCol = equipmentBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const subStatusCol = subBoard?.columns?.find((c) => c.name === 'Status')?.id;
  const safetyStatusCol = safetyBoard?.columns?.find((c) => c.name === 'Status')?.id;

  const activeProjects = countByStatus(projectItems, projectStatusCol, 'In Progress');
  const equipmentInService = countByStatus(equipmentItems, equipmentStatusCol, 'In Service');
  const activeSubs = countByStatus(subItems, subStatusCol, 'Active');
  const openIncidents = countByStatus(safetyItems, safetyStatusCol, 'Open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">CraneStack Construction — Building Tomorrow Today</p>
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
        <StatCard icon={HardHat} label="Active Projects" value={activeProjects} color="#EA580C" />
        <StatCard icon={Truck} label="Equipment In Service" value={equipmentInService} color="#C2410C" />
        <StatCard icon={Users} label="Active Subcontractors" value={activeSubs} color="#9A3412" />
        <StatCard icon={ShieldCheck} label="Open Incidents" value={openIncidents} color="#FB923C" />
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
            {['Bidding', 'Awarded', 'In Progress', 'Inspection', 'Complete'].map((status) => {
              const count = countByStatus(projectItems, projectStatusCol, status);
              const total = projectItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Bidding: '#579BFC', Awarded: '#FDAB3D', 'In Progress': '#00C875',
                Inspection: '#9B59B6', Complete: '#C4C4C4',
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

        {/* Equipment Tracker Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-brand-600" />
            <h3 className="font-semibold">Equipment Tracker</h3>
          </div>
          <div className="space-y-3">
            {['In Service', 'Maintenance', 'Available', 'Out of Service'].map((status) => {
              const count = countByStatus(equipmentItems, equipmentStatusCol, status);
              const total = equipmentItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                'In Service': '#00C875', Maintenance: '#FDAB3D', Available: '#579BFC', 'Out of Service': '#E2445C',
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

        {/* Subcontractor Board Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold">Subcontractor Board</h3>
          </div>
          <div className="space-y-3">
            {['Active', 'Pending Approval', 'On Hold', 'Inactive'].map((status) => {
              const count = countByStatus(subItems, subStatusCol, status);
              const total = subItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Active: '#00C875', 'Pending Approval': '#FDAB3D', 'On Hold': '#579BFC', Inactive: '#C4C4C4',
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

        {/* Safety Compliance Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-brand-600" />
            <h3 className="font-semibold">Safety Compliance</h3>
          </div>
          <div className="space-y-3">
            {['Open', 'Under Review', 'Resolved', 'Closed'].map((status) => {
              const count = countByStatus(safetyItems, safetyStatusCol, status);
              const total = safetyItems.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                Open: '#E2445C', 'Under Review': '#FDAB3D', Resolved: '#00C875', Closed: '#C4C4C4',
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
            <p className="text-2xl font-bold text-brand-600">{projectItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Projects</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-700">{equipmentItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Equipment</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-800">{subItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Subcontractors</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-brand-500">{safetyItems.length}</p>
            <p className="text-xs text-gray-500 mt-1">Safety Records</p>
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
                  htmlFor="cranestack-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="cranestack-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Project Pipeline"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="cranestack-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="cranestack-new-board-description"
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
