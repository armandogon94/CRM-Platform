import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Plus, LayoutGrid, Table, Users, X } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/common/ToastProvider';
// `import type { Board }` was removed alongside the `api.post<{ board: Board }>`
// generic — api.boards.create now carries the typing internally.
import type { ThemeConfig } from '../theme';

interface BoardListPageProps {
  theme?: ThemeConfig;
}

export default function BoardListPage({ theme }: BoardListPageProps) {
  const { boards, refreshBoards, isLoading, workspace } = useWorkspace();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const primaryColor = theme?.primaryColor || '#2563EB';

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !workspace) return;

    setCreating(true);
    try {
      // Use the typed api.boards.create (Slice 20 A2) so the response
      // envelope is checked at compile-time against our ApiResponse<T>
      // shape. On success the dialog closes + the board list refreshes;
      // on failure (success: false) the dialog stays open with typed
      // values preserved so the user can correct + retry without
      // re-entering everything. (Slice 20 B2 replaced the silent catch.)
      const res = await api.boards.create({
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || null,
        workspaceId: workspace.id,
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
      // Network rejection or other unhandled error. Surface a generic
      // message — the raw Error text is rarely user-meaningful.
      showToast({
        variant: 'error',
        title: 'Could not create board',
        description: err instanceof Error ? err.message : 'Network error.',
      });
    } finally {
      setCreating(false);
    }
  };

  const getBoardIcon = (boardType: string) => {
    switch (boardType) {
      case 'kanban':
        return <LayoutGrid size={20} className="text-blue-500" />;
      case 'shareable':
        return <Users size={20} className="text-green-500" />;
      default:
        return <Table size={20} style={{ color: primaryColor }} />;
    }
  };

  return (
    <MainLayout theme={theme}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and organize your work across boards
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="text-white font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2 hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} />
            New Board
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
            />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Table size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No boards yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first board to get started
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="text-white font-medium px-4 py-2 rounded-lg transition-opacity inline-flex items-center gap-2 hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={18} />
              Create Board
            </button>
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
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    {getBoardIcon(board.boardType)}
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

        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Board
                </h3>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateBoard} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Board Name
                  </label>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="e.g., Sales Pipeline"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
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
                    style={{ backgroundColor: primaryColor }}
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
    </MainLayout>
  );
}
