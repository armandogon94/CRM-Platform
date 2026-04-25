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
  const [allItems, setAllItems] = useState<Record<number, Item[]>>({});
  const [automations, setAutomations] = useState<Automation[]>([]);

  // Slice 20.5 B: per-board state (currentBoard, currentItems, loading,
  // item:* socket handlers) is now owned by the shared useBoard hook
  // inside BoardPage. App.tsx only tracks which board is selected via
  // activeView and lets BoardPage drive its own fetch + realtime.

  // Load boards (extracted in Slice 20B C4 so OverviewDashboard can
  // call it after a successful create-board to refresh the sidebar).
  const refreshBoards = useCallback(async () => {
    if (!user?.workspaceId) return;
    const res = await api.getBoards(user.workspaceId);
    if (res.success && res.data) {
      setBoards(res.data.boards || res.data as any || []);
    }
  }, [user?.workspaceId]);

  useEffect(() => {
    refreshBoards();
  }, [refreshBoards]);

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
    if (key === 'automations') {
      loadAutomations();
    }
  };

  const handleTriggerAutomation = async (id: number) => {
    await api.triggerAutomation(id);
  };

  const renderContent = () => {
    if (activeView === 'overview') {
      return <OverviewDashboard boards={boards} allItems={allItems} onBoardCreated={refreshBoards} />;
    }
    if (activeView === 'automations') {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Automations</h2>
          <p className="text-sm text-gray-500">
            Manage workflow automations across all UrbanNest boards
          </p>
          <AutomationsPanel automations={automations} onTrigger={handleTriggerAutomation} />
        </div>
      );
    }
    const boardId = parseInt(activeView, 10);
    if (Number.isNaN(boardId)) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">Select a board from the sidebar</p>
        </div>
      );
    }
    // BoardPage now owns its fetch + realtime via useBoard(boardId).
    // Remount on activeView change (key prop) ensures useBoard's
    // boardId-keyed effect runs with a fresh subscription per board.
    return <BoardPage key={boardId} boardId={boardId} />;
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
          <p className="text-gray-500">Loading UrbanNest...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AppContent />;
}
