import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, LayoutGrid, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { Board } from '../types';

/**
 * NovaPay router-based landing for /boards (Slice 19.6 migration).
 *
 * DOM contract required by Slice 19 D1 spec:
 *   - h1 "Boards"
 *   - Each board rendered as a <button> whose accessible name contains
 *     the board's name (e.g. "Transaction Pipeline")
 *   - Click navigates to /boards/:id via react-router `useNavigate`
 *
 * The richer OverviewDashboard still exists at /overview for the
 * NovaPay-specific KPI view; /boards is the universal entry point.
 */
export function BoardListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.workspaceId) return;
    api.getBoards(user.workspaceId).then((res) => {
      if (res.success && res.data) {
        setBoards(res.data.boards || []);
      }
      setLoading(false);
    });
  }, [user?.workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and organize your work across NovaPay boards
        </p>
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
    </div>
  );
}
