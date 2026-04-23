import { LayoutDashboard, CreditCard, Building2, ShieldCheck, Zap, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  /** URL-derived active key. See App.tsx for the mapping rules. */
  activeBoard: string | null;
  boards: { id: number; name: string }[];
}

const boardIcons: Record<string, typeof CreditCard> = {
  'Transaction Pipeline': CreditCard,
  'Merchant Onboarding': Building2,
  'Compliance & Regulatory': ShieldCheck,
};

export function Sidebar({ activeBoard, boards }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const goTo = (path: string) => () => navigate(path);

  return (
    <aside className="w-64 bg-brand-800 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-400 rounded-lg flex items-center justify-center font-bold text-brand-900 text-lg">
            N
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">NovaPay</h1>
            <p className="text-brand-300 text-xs">Digital Payment Processing</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          Dashboard
        </div>
        <button
          onClick={goTo('/overview')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            activeBoard === 'overview'
              ? 'bg-brand-600 text-white'
              : 'text-brand-200 hover:bg-brand-700'
          }`}
        >
          <LayoutDashboard size={18} />
          Overview
        </button>
        <button
          onClick={goTo('/boards')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            activeBoard === 'boards'
              ? 'bg-brand-600 text-white'
              : 'text-brand-200 hover:bg-brand-700'
          }`}
        >
          <LayoutDashboard size={18} />
          All Boards
        </button>

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          Boards
        </div>
        {boards.map((board) => {
          const Icon = boardIcons[board.name] || CreditCard;
          return (
            <button
              key={board.id}
              onClick={goTo(`/boards/${board.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeBoard === String(board.id)
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-200 hover:bg-brand-700'
              }`}
            >
              <Icon size={18} />
              {board.name}
            </button>
          );
        })}

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          System
        </div>
        <button
          onClick={goTo('/automations')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            activeBoard === 'automations'
              ? 'bg-brand-600 text-white'
              : 'text-brand-200 hover:bg-brand-700'
          }`}
        >
          <Zap size={18} />
          Automations
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-200 hover:bg-brand-700 transition-colors"
        >
          <Settings size={18} />
          Settings
        </button>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-sm font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-brand-300 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="text-brand-300 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
