import { useState, useEffect, useCallback } from 'react';
import type { Board, Item } from '@/types';
import api from '@/utils/api';

interface UseBoardReturn {
  board: Board | null;
  items: Item[];
  loading: boolean;
  error: string | null;
  refreshBoard: () => Promise<void>;
  refreshItems: (page?: number, limit?: number) => Promise<void>;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export function useBoard(boardId: number): UseBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refreshBoard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<{ board: Board }>(`/boards/${boardId}`);
      if (res.success && res.data) {
        setBoard(res.data.board || (res.data as any));
      } else {
        setError(res.error || 'Failed to load board');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load board');
    }
  }, [boardId]);

  const refreshItems = useCallback(
    async (page: number = 1, limit: number = 50) => {
      try {
        const res = await api.get<{ items: Item[] }>(
          `/boards/${boardId}/items?page=${page}&limit=${limit}`
        );
        if (res.success && res.data) {
          const itemList = res.data.items || (res.data as any) || [];
          setItems(itemList);
          if (res.pagination) {
            setTotalItems(res.pagination.total);
            setCurrentPage(res.pagination.page);
            setTotalPages(res.pagination.totalPages);
          } else {
            setTotalItems(itemList.length);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load items');
      }
    },
    [boardId]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBoard() {
      setLoading(true);
      setError(null);

      try {
        const [boardRes, itemsRes] = await Promise.all([
          api.get<{ board: Board }>(`/boards/${boardId}`),
          api.get<{ items: Item[] }>(`/boards/${boardId}/items?page=1&limit=50`),
        ]);

        if (cancelled) return;

        if (boardRes.success && boardRes.data) {
          setBoard(boardRes.data.board || (boardRes.data as any));
        } else {
          setError(boardRes.error || 'Failed to load board');
        }

        if (itemsRes.success && itemsRes.data) {
          const itemList = itemsRes.data.items || (itemsRes.data as any) || [];
          setItems(itemList);
          if (itemsRes.pagination) {
            setTotalItems(itemsRes.pagination.total);
            setCurrentPage(itemsRes.pagination.page);
            setTotalPages(itemsRes.pagination.totalPages);
          } else {
            setTotalItems(itemList.length);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load board');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  return {
    board,
    items,
    loading,
    error,
    refreshBoard,
    refreshItems,
    totalItems,
    currentPage,
    totalPages,
  };
}
