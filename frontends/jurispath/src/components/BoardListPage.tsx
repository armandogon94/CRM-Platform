import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board } from '../types';
import { OverviewDashboard } from './OverviewDashboard';

/**
 * JurisPath state-based board-list surface (Slice 20 C4).
 *
 * Unlike NovaPay, JurisPath doesn't use react-router for nav — the
 * Sidebar drives `activeView` state in App.tsx and this component
 * renders when `activeView === 'overview'`. To honour the Slice 20
 * Phase D expectation that the overview surface is reachable at
 * `/boards` and exposes a "+ New Board" affordance, this component
 * wraps the legacy <OverviewDashboard> with a header row that carries
 * the New-Board button + dialog.
 *
 * Matches the NovaPay C4 (1898280) shape wherever the underlying API
 * is the same:
 *   - api.createBoard wires the flat POST /boards shim (A2.5)
 *   - Errors surface via the shared <ToastProvider> (never silent
 *     catch — the same contract NovaPay's C4 dialog honours)
 *   - Labels on inputs use htmlFor for a11y
 *   - Role gating: only `user.role === 'admin'` sees the button
 *
 * Deliberate deviations vs. NovaPay C4:
 *   - No useNavigate / card grid here — JurisPath's board navigation
 *     stays in the Sidebar. The overview content below the header
 *     is unchanged (still OverviewDashboard stats + pipelines).
 *   - `onBoardsRefresh` is a parent callback rather than an internal
 *     api.getBoards re-fetch because App.tsx owns the `boards` array
 *     and pipes it into both Sidebar and OverviewDashboard; refreshing
 *     in isolation would leave stale views elsewhere.
 *
 * Rationale for NOT adopting the shared @crm/shared/pages/BoardListPage:
 *   Same as the NovaPay C4 commit body — the shared page uses
 *   useNavigate (crashes outside <Router>) and the shared `api`
 *   module's default token key (`crm_access_token`), which conflicts
 *   with JurisPath's `jurispath_token` AuthContext. Local dialog
 *   achieves identical behaviour; migration is a future cleanup slice.
 */

interface BoardListPageProps {
  boards: Board[];
  allItems: Record<number, import('../types').Item[]>;
  onBoardsRefresh: () => Promise<void> | void;
}

export function BoardListPage({ boards, allItems, onBoardsRefresh }: BoardListPageProps) {
  const { user } = useAuth();
  const { show: showToast } = useToast();

  // Create-dialog state.
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // RBAC: only admin sees "+ New Board" per SPEC §Slice 20 RBAC matrix.
  // member is explicitly NOT given board-create per the product call;
  // viewer sees nothing per rbac-viewer.spec.ts.
  const canCreateBoard = user?.role === 'admin';

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
        await onBoardsRefresh();
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

  return (
    <div className="space-y-6">
      {/* Header row with the New Board affordance. Sits above the
          existing OverviewDashboard content so the "/boards" URL
          exposes the button per Slice 20 Flow E. */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize your work across JurisPath boards
          </p>
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

      {/* Unchanged legacy overview content. */}
      <OverviewDashboard boards={boards} allItems={allItems} />

      {/* Create-board dialog. Role-gated open: only admin can reach
          this via the trigger button above, but the render is cheap
          and keeps the component simple. */}
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
                  htmlFor="jurispath-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="jurispath-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Case Management"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="jurispath-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="jurispath-new-board-description"
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
