import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Workspace, Board } from '../types/index';
import { useAuth } from './AuthContext';
import api from '../utils/api';

interface WorkspaceContextType {
  workspace: Workspace | null;
  boards: Board[];
  selectedBoard: Board | null;
  setSelectedBoard: (board: Board | null) => void;
  refreshBoards: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.workspaceId) {
      setWorkspace(null);
      setBoards([]);
      setSelectedBoard(null);
      return;
    }

    setIsLoading(true);

    api
      .get<{ workspace: Workspace }>(`/workspaces/${user.workspaceId}`)
      .then((res) => {
        if (res.success && res.data) {
          setWorkspace(res.data.workspace || (res.data as any));
        }
      })
      .catch(() => {});

    api
      .get<{ boards: Board[] }>(`/boards?workspaceId=${user.workspaceId}`)
      .then((res) => {
        if (res.success && res.data) {
          const boardList = res.data.boards || (res.data as any) || [];
          setBoards(boardList);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated, user?.workspaceId]);

  const refreshBoards = useCallback(async () => {
    if (!user?.workspaceId) return;

    const res = await api.get<{ boards: Board[] }>(
      `/boards?workspaceId=${user.workspaceId}`
    );
    if (res.success && res.data) {
      const boardList = res.data.boards || (res.data as any) || [];
      setBoards(boardList);
    }
  }, [user?.workspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        boards,
        selectedBoard,
        setSelectedBoard,
        refreshBoards,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
