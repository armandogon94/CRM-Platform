import { LayoutDashboard, Package, MapPin, Truck, Zap, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeBoard: string | null;
  onBoardSelect: (boardKey: string) => void;
  boards: { id: number; name: string }[];
}

const boardIcons: Record<string, typeof Package> = {
  'Shipment Tracker': Package,
  'Route Board': MapPin,
  'Fleet & Vehicle Tracking': Truck,
};

export function Sidebar({ activeBoard, onBoardSelect, boards }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-brand-800 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-400 rounded-lg flex items-center justify-center font-bold text-brand-900 text-lg">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SwiftRoute</h1>
            <p className="text-brand-300 text-xs">Logistics Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          Dashboard
        </div>
        <button
          onClick={() => onBoardSelect('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            activeBoard === 'overview'
              ? 'bg-brand-600 text-white'
              : 'text-brand-200 hover:bg-brand-700'
          }`}
        >
          <LayoutDashboard size={18} />
          Overview
        </button>

        <div className="px-3 pt-4 pb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          Boards
        </div>
        {boards.map((board) => {
          const Icon = boardIcons[board.name] || Package;
          return (
            <button
              key={board.id}
              onClick={() => onBoardSelect(String(board.id))}
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
          onClick={() => onBoardSelect('automations')}
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
