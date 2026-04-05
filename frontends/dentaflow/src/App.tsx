import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { BoardPage } from './components/BoardPage';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AutomationsPanel } from './components/AutomationsPanel';
import { api } from './utils/api';
import type { Board, Item, Automation } from './types';

function AppContent() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeView, setActiveView] = useState<string>('overview');
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [currentItems, setCurrentItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Record<number, Item[]>>({});
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);

  // Load boards
  useEffect(() => {
    if (!user?.workspaceId) return;
    api.getBoards(user.workspaceId).then((res) => {
      if (res.success && res.data) {
        setBoards(res.data.boards || res.data as any || []);
      }
    });
  }, [user?.workspaceId]);

  // Load all items for overview dashboard
  useEffect(() => {
    if (boards.length === 0) return;
    const loadAll = async () => {
      const itemMap: Record<number, Item[]> = {};
      for (const board of boards) {
        const res = await api.getBoardItems(board.id);
        if (res.success && res.data) {
          itemMap[board.id] = res.data.items || res.data as any || [];
        }
      }
      setAllItems(itemMap);
    };
    loadAll();
  }, [boards]);

  // Load board when selected
  const loadBoard = useCallback(async (boardId: number) => {
    setBoardLoading(true);
    const [boardRes, itemsRes] = await Promise.all([
      api.getBoard(boardId),
      api.getBoardItems(boardId),
    ]);
    if (boardRes.success && boardRes.data) {
      setCurrentBoard(boardRes.data.board || boardRes.data as any);
    }
    if (itemsRes.success && itemsRes.data) {
      setCurrentItems(itemsRes.data.items || itemsRes.data as any || []);
    }
    setBoardLoading(false);
  }, []);

  // Load automations
  const loadAutomations = useCallback(async () => {
    const allAutos: Automation[] = [];
    for (const board of boards) {
      const res = await api.getAutomations(board.id);
      if (res.success && res.data) {
        const autos = res.data.automations || res.data as any || [];
        allAutos.push(...autos);
      }
    }
    setAutomations(allAutos);
  }, [boards]);

  const handleBoardSelect = (key: string) => {
    setActiveView(key);
    if (key !== 'overview' && key !== 'automations') {
      const boardId = parseInt(key, 10);
      if (!isNaN(boardId)) {
        loadBoard(boardId);
      }
    }
    if (key === 'automations') {
      loadAutomations();
    }
  };

  const handleTriggerAutomation = async (id: number) => {
    await api.triggerAutomation(id);
  };

  const renderContent = () => {
    if (activeView === 'overview') {
      return <OverviewDashboard boards={boards} allItems={allItems} />;
    }
    if (activeView === 'automations') {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Automations</h2>
          <p className="text-sm text-gray-500">
            Manage workflow automations across all DentaFlow boards
          </p>
          <AutomationsPanel automations={automations} onTrigger={handleTriggerAutomation} />
        </div>
      );
    }
    return (
      <BoardPage board={currentBoard} items={currentItems} loading={boardLoading} />
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeBoard={activeView}
        onBoardSelect={handleBoardSelect}
        boards={boards}
      />
      <main className="flex-1 ml-64 p-6">
        {renderContent()}
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
          <p className="text-gray-500">Loading DentaFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AppContent />;
}
