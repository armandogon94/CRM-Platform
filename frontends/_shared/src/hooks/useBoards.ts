import { useState, useEffect, useCallback } from 'react';
import type { Board } from '../types/index';
import { api } from '../utils/api';

export function useBoards(workspaceId: number | undefined) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const res = await api.get<{ boards: Board[] }>(`/boards?workspaceId=${workspaceId}`);
    if (res.success && res.data) {
      setBoards(res.data.boards || []);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { boards, loading, refetch: fetchBoards };
}
