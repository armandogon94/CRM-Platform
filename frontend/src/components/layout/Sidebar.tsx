import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Table,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { boards } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [boardsExpanded, setBoardsExpanded] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const isBoardActive = (boardId: number) =>
    location.pathname === `/boards/${boardId}`;

  const initials =
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <aside
      className={clsx(
        'bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white text-sm">
              C
            </div>
            <span className="font-bold text-lg">CRM</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'text-slate-400 hover:text-white transition-colors',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {/* Home */}
        <button
          onClick={() => navigate('/boards')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive('/boards')
              ? 'bg-brand-primary text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
          title="Home"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Home</span>}
        </button>

        {/* Boards Section */}
        {!collapsed && (
          <div className="pt-4">
            <button
              onClick={() => setBoardsExpanded(!boardsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
            >
              {boardsExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              Boards
            </button>
          </div>
        )}

        {(collapsed || boardsExpanded) &&
          boards.map((board) => (
            <button
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isBoardActive(board.id)
                  ? 'bg-brand-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
              title={board.name}
            >
              <Table size={16} />
              {!collapsed && (
                <span className="truncate">{board.name}</span>
              )}
            </button>
          ))}

        {/* Settings */}
        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settings
            </div>
          </div>
        )}
        <button
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors'
          )}
          title="Settings"
        >
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-xs font-medium shrink-0">
            {initials || '?'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
