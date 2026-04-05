import { useState, useEffect, useCallback } from 'react';
import type { Board } from '../types';
import { api } from '../utils/api';

export function useBoards(workspaceId: number | undefined) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const res = await api.getBoards(workspaceId);
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

export function useBoard(boardId: number | null) {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    const [boardRes, itemsRes] = await Promise.all([
      api.getBoard(boardId),
      api.getBoardItems(boardId),
    ]);
    if (boardRes.success && boardRes.data) {
      setBoard(boardRes.data.board);
    }
    if (itemsRes.success && itemsRes.data) {
      setItems(itemsRes.data.items || []);
    }
    setLoading(false);
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return { board, items, loading, refetch: fetchBoard };
}
