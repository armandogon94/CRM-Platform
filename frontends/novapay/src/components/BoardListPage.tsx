import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Table, LayoutGrid, Users, X } from 'lucide-react';
import { useToast } from '@crm/shared/components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board } from '../types';

/**
 * NovaPay router-based landing for /boards (Slice 19.6 migration +
 * Slice 20 C4 New-Board dialog + RBAC gating).
 *
 * DOM contract required by Slice 19 D1 spec:
 *   - h1 "Boards"
 *   - Each board rendered as a <button> whose accessible name contains
 *     the board's name (e.g. "Transaction Pipeline")
 *   - Click navigates to /boards/:id via react-router `useNavigate`
 *
 * Slice 20 C4 additions:
 *   - "+ New Board" button in the top-right (admin + manager only;
 *     viewer + member get no create affordance per the RBAC matrix
 *     — member's no-create-board is a product decision, not a
 *     security one).
 *   - Modal dialog with name/description form; POSTs via the flat
 *     /boards shim (A2.5) through NovaPay's local api, surfacing
 *     errors via the shared Toast provider (never silent catch).
 *
 * The richer OverviewDashboard still exists at /overview for the
 * NovaPay-specific KPI view; /boards is the universal entry point.
 */
export function BoardListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Create-dialog state.
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // RBAC: only admin sees "New Board" per SPEC §Slice 20 RBAC matrix.
  // manager doesn't exist as a real role (see A4 reconciliation note);
  // member is explicitly NOT given board-create per the product call.
  const canCreateBoard = user?.role === 'admin';

  const refreshBoards = async () => {
    if (!user?.workspaceId) return;
    const res = await api.getBoards(user.workspaceId);
    if (res.success && res.data) {
      setBoards(res.data.boards || []);
    }
  };

  useEffect(() => {
    if (!user?.workspaceId) {
      setLoading(false);
      return;
    }
    api.getBoards(user.workspaceId).then((res) => {
      if (res.success && res.data) {
        setBoards(res.data.boards || []);
      }
      setLoading(false);
    });
  }, [user?.workspaceId]);

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
        await refreshBoards();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize your work across NovaPay boards
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

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Table size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No boards yet
          </h3>
          <p className="text-gray-500">
            Boards are seeded during the NovaPay workspace setup.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                  {board.boardType === 'shareable' ? (
                    <Users size={20} className="text-green-500" />
                  ) : board.boardType === 'private' ? (
                    <LayoutGrid size={20} className="text-blue-500" />
                  ) : (
                    <Table size={20} className="text-brand-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{board.groups?.length || 0} groups</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>
                  {board.groups?.reduce(
                    (acc, g) => acc + (g.items?.length || 0),
                    0
                  ) || 0}{' '}
                  items
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create-board dialog. Role-gated open: only admin can reach this
          via the trigger button above, but the render is cheap and keeps
          the component simple. */}
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
                  htmlFor="novapay-new-board-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Board Name
                </label>
                <input
                  id="novapay-new-board-name"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
                  placeholder="e.g., Sales Pipeline"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="novapay-new-board-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="novapay-new-board-description"
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
