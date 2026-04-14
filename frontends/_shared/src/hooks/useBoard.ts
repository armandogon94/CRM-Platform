import { useState, useEffect, useCallback } from 'react';
import type { Board, Item, BoardGroup, Column, ColumnValue } from '../types/index';
import { useWebSocket } from './useWebSocket';
import api from '../utils/api';

interface FilterItem {
  columnId: number;
  operator: string;
  value?: any;
}

interface RefreshItemsOptions {
  page?: number;
  limit?: number;
  columnFilters?: FilterItem[];
  sortByColumn?: number;
  sortOrder?: 'ASC' | 'DESC';
}

interface UseBoardReturn {
  board: Board | null;
  items: Item[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refreshBoard: () => Promise<void>;
  refreshItems: (options?: RefreshItemsOptions) => Promise<void>;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

// Pure state-update helpers (exported for testability)

export function addItem(items: Item[], newItem: Item): Item[] {
  if (items.some((i) => i.id === newItem.id)) return items;
  return [...items, newItem];
}

export function updateItem(items: Item[], updated: Item): Item[] {
  return items.map((i) => (i.id === updated.id ? updated : i));
}

export function removeItem(items: Item[], itemId: number): Item[] {
  return items.filter((i) => i.id !== itemId);
}

export function updateColumnValue(
  items: Item[],
  itemId: number,
  columnId: number,
  value: ColumnValue
): Item[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;
    const cvs = item.columnValues || [];
    const idx = cvs.findIndex((cv) => cv.columnId === columnId);
    const newCvs =
      idx >= 0
        ? cvs.map((cv) =>
            cv.columnId === columnId ? { ...cv, value: value.value ?? value } : cv
          )
        : [...cvs, value];
    return { ...item, columnValues: newCvs };
  });
}

export function addGroup(board: Board, group: BoardGroup): Board {
  if (board.groups.some((g) => g.id === group.id)) return board;
  return { ...board, groups: [...board.groups, group] };
}

export function updateGroup(board: Board, updated: BoardGroup): Board {
  return {
    ...board,
    groups: board.groups.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)),
  };
}

export function removeGroup(board: Board, groupId: number): Board {
  return { ...board, groups: board.groups.filter((g) => g.id !== groupId) };
}

export function addColumn(board: Board, column: Column): Board {
  if (board.columns.some((c) => c.id === column.id)) return board;
  return { ...board, columns: [...board.columns, column] };
}

export function updateColumn(board: Board, updated: Column): Board {
  return {
    ...board,
    columns: board.columns.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
  };
}

export function removeColumn(board: Board, columnId: number): Board {
  return { ...board, columns: board.columns.filter((c) => c.id !== columnId) };
}

export function useBoard(boardId: number): UseBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { isConnected } = useWebSocket(boardId, {
    onItemCreated: (item: Item) => {
      setItems((prev) => addItem(prev, item));
      setTotalItems((prev) => prev + 1);
    },
    onItemUpdated: (item: Item) => {
      setItems((prev) => updateItem(prev, item));
    },
    onItemDeleted: ({ itemId }: { itemId: number }) => {
      setItems((prev) => removeItem(prev, itemId));
      setTotalItems((prev) => Math.max(0, prev - 1));
    },
    onColumnValueChanged: (data: {
      itemId: number;
      columnId: number;
      value: ColumnValue;
    }) => {
      setItems((prev) =>
        updateColumnValue(prev, data.itemId, data.columnId, data.value)
      );
    },
    onGroupCreated: (group: BoardGroup) => {
      setBoard((prev) => (prev ? addGroup(prev, group) : prev));
    },
    onGroupUpdated: (group: BoardGroup) => {
      setBoard((prev) => (prev ? updateGroup(prev, group) : prev));
    },
    onGroupDeleted: ({ id }: { id: number; boardId: number }) => {
      setBoard((prev) => (prev ? removeGroup(prev, id) : prev));
    },
    onColumnCreated: (column: Column) => {
      setBoard((prev) => (prev ? addColumn(prev, column) : prev));
    },
    onColumnUpdated: (column: Column) => {
      setBoard((prev) => (prev ? updateColumn(prev, column) : prev));
    },
    onColumnDeleted: ({ id }: { id: number; boardId: number }) => {
      setBoard((prev) => (prev ? removeColumn(prev, id) : prev));
    },
  });

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
    async (options: RefreshItemsOptions = {}) => {
      const { page = 1, limit = 50, columnFilters, sortByColumn, sortOrder } = options;
      try {
        let url = `/boards/${boardId}/items?page=${page}&limit=${limit}`;
        if (columnFilters && columnFilters.length > 0) {
          const encoded = btoa(JSON.stringify(columnFilters));
          url += `&columnFilters=${encoded}`;
        }
        if (sortByColumn) url += `&sortByColumn=${sortByColumn}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        const res = await api.get<{ items: Item[] }>(url);
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
    isConnected,
    refreshBoard,
    refreshItems,
    totalItems,
    currentPage,
    totalPages,
  };
}
