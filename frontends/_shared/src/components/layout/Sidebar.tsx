import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { ThemeConfig } from '../../theme';
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

interface SidebarProps {
  theme?: ThemeConfig;
}

function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Sidebar({ theme }: SidebarProps) {
  const { user, logout } = useAuth();
  const { boards } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [boardsExpanded, setBoardsExpanded] = useState(true);

  const primaryColor = theme?.primaryColor || '#6366f1';
  const companyName = theme?.companyName || 'CRM';
  const initial = companyName[0]?.toUpperCase() || 'C';

  const isActive = (path: string) => location.pathname === path;
  const isBoardActive = (boardId: number) =>
    location.pathname === `/boards/${boardId}`;

  const initials =
    (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <aside
      style={{
        width: collapsed ? '4rem' : '16rem',
        transition: 'width 200ms',
      }}
      className="bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40"
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {initial}
            </div>
            <span className="font-bold text-lg truncate">{companyName}</span>
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
        <button
          onClick={() => navigate('/boards')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive('/boards')
              ? 'text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
          style={isActive('/boards') ? { backgroundColor: primaryColor } : undefined}
          title="Home"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Home</span>}
        </button>

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
                  ? 'text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
              style={isBoardActive(board.id) ? { backgroundColor: primaryColor } : undefined}
              title={board.name}
            >
              <Table size={16} />
              {!collapsed && (
                <span className="truncate">{board.name}</span>
              )}
            </button>
          ))}

        {!collapsed && (
          <div className="pt-4">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settings
            </div>
          </div>
        )}
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
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
