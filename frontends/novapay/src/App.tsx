import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { BoardPage } from './components/BoardPage';
import { BoardListPage } from './components/BoardListPage';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AutomationsPanel } from './components/AutomationsPanel';
import { api } from './utils/api';
import { getAuthToken } from './utils/api';
import type { Board, Item, Automation } from './types';
import { io } from 'socket.io-client';

/**
 * Authenticated shell — loads boards + wires WebSocket, renders the
 * current route inside the NovaPay layout.
 *
 * Slice 19.6 migration: previously this component owned `activeView`
 * state and switched between views imperatively. Now the URL is the
 * source of truth (react-router), and per-route components own their
 * own data fetches where appropriate.
 */
function AuthenticatedShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [boards, setBoards] = useState<Board[]>([]);
  const [allItems, setAllItems] = useState<Record<number, Item[]>>({});
  const [automations, setAutomations] = useState<Automation[]>([]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Real-time WebSocket — subscribe to board events so listeners in
  // child routes see a consistent socket instance across navigations.
  useEffect(() => {
    if (!user) return;
    const token = getAuthToken() || '';
    const socket = io('/', { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Join the current board's room whenever the URL is /boards/:id.
  useEffect(() => {
    const match = location.pathname.match(/^\/boards\/(\d+)/);
    if (match && socketRef.current?.connected) {
      socketRef.current.emit('board:join', { boardId: Number(match[1]) });
    }
  }, [location.pathname]);

  // Boards list — feeds both the Sidebar and the OverviewDashboard.
  useEffect(() => {
    if (!user?.workspaceId) return;
    api.getBoards(user.workspaceId).then((res) => {
      if (res.success && res.data) {
        setBoards(res.data.boards || []);
      }
    });
  }, [user?.workspaceId]);

  // Preload items for OverviewDashboard aggregates (lightweight — only
  // fires when the user lands on /overview via the Sidebar link).
  useEffect(() => {
    if (boards.length === 0) return;
    if (location.pathname !== '/overview') return;
    const loadAll = async () => {
      const itemMap: Record<number, Item[]> = {};
      for (const board of boards) {
        const res = await api.getBoardItems(board.id);
        if (res.success && res.data) {
          itemMap[board.id] = res.data.items || [];
        }
      }
      setAllItems(itemMap);
    };
    loadAll();
  }, [boards, location.pathname]);

  // Load automations when the /automations route is active.
  useEffect(() => {
    if (location.pathname !== '/automations') return;
    const load = async () => {
      const allAutos: Automation[] = [];
      for (const board of boards) {
        const res = await api.getAutomations(board.id);
        if (res.success && res.data) {
          allAutos.push(...(res.data.automations || []));
        }
      }
      setAutomations(allAutos);
    };
    load();
  }, [boards, location.pathname]);

  const handleTriggerAutomation = async (id: number) => {
    await api.triggerAutomation(id);
  };

  // Sidebar's active-key derives from the URL so the highlight tracks
  // navigation without a parallel state variable.
  const sidebarActive =
    location.pathname === '/overview'
      ? 'overview'
      : location.pathname === '/automations'
      ? 'automations'
      : location.pathname.startsWith('/boards/')
      ? location.pathname.split('/')[2] ?? 'boards'
      : 'boards';

  return (
    <div className="flex min-h-screen">
      <Sidebar activeBoard={sidebarActive} boards={boards} />
      <main className="flex-1 ml-64">
        <Routes>
          <Route path="/boards" element={<BoardListPage />} />
          <Route path="/boards/:id" element={<BoardPage />} />
          <Route
            path="/overview"
            element={
              <div className="p-6">
                <OverviewDashboard boards={boards} allItems={allItems} />
              </div>
            }
          />
          <Route
            path="/automations"
            element={
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Automations</h2>
                <p className="text-sm text-gray-500">
                  Manage workflow automations across all NovaPay boards
                </p>
                <AutomationsPanel
                  automations={automations}
                  onTrigger={handleTriggerAutomation}
                />
              </div>
            }
          />
          {/* Default landing post-login — also serves `/` pre-auth users
              who made it past the auth gate (shouldn't happen normally
              but guards against a race during token refresh). */}
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading NovaPay...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: ALL routes render the login page. After login
  // success, LoginPage calls `navigate('/boards')` so the authed
  // branch below takes over and the URL becomes stable.
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <AuthenticatedShell />;
}
