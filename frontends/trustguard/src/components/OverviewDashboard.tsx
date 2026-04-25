import { useState } from 'react';
import { ShieldAlert, FileText, ClipboardCheck, TrendingUp, ShieldCheck, XCircle, Plus, X } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">TrustGuard Insurance — Protecting What Matters Most</p>
        </div>
        {canCreateBoard && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="text-white font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            <Plus size={18} />
            New Board
          </button>
        )}
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
                  htmlFor="trustguard-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="trustguard-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Claims Pipeline"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="trustguard-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="trustguard-new-board-description"
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
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity disabled:opacity-50 flex items-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: '#1E3A5F' }}
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
