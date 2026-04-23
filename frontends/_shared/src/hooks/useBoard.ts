import { useState, useEffect, useCallback, useRef } from 'react';
import type { Board, Item, BoardGroup, Column, ColumnValue } from '../types/index';
import { useWebSocket } from './useWebSocket';
import api from '../utils/api';
import { useToast } from '../components/common/ToastProvider';

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

interface CreateItemMutationInput {
  groupId: number;
  name: string;
  values?: Record<number, unknown>;
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
  // Mutations (Slice 20 A3) — callers get stable references + toast-on-error
  // so the industry App shells can thread these through without boilerplate.
  createItem: (input: CreateItemMutationInput) => Promise<void>;
  updateItemValue: (itemId: number, columnId: number, value: unknown) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
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

  // useToast throws if the consumer isn't wrapped in <ToastProvider>.
  // That's an intentional constraint for Slice 20+ — Phase C industry
  // wiring mounts <ToastProvider> at the app root so every useBoard
  // call-site gets the same error-surface.
  const { show: showToast } = useToast();

  // Mirror the items list into a ref so mutation callbacks can read the
  // latest snapshot without being recreated on every render. Reading
  // inside a setItems updater is unsafe under React 18 StrictMode — the
  // updater may run twice and the second pass sees post-update state.
  const itemsRef = useRef<Item[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

  // ── Mutations ────────────────────────────────────────────────────────
  //
  // Contract decisions (spec §Flow A/C/D, SPEC.md §Slice 20):
  //   - createItem: server round-trip + WebSocket echo append. We do NOT
  //     locally insert the item on success — the existing onItemCreated
  //     socket handler above does that. Double-inserting was a bug in
  //     earlier drafts; deferring to WS echo is the authoritative path.
  //   - updateItemValue: optimistic local update, rollback on error.
  //     Status cells on a 200-row Table view need sub-100ms perceived
  //     latency; waiting for the server echo felt laggy during spike.
  //   - deleteItem: optimistic local remove, re-insert on error. The
  //     WS echo deletion handler is idempotent (filters by id) so the
  //     local optimistic remove + echo remove is safe to double-apply.

  const createItem = useCallback(
    async (input: CreateItemMutationInput) => {
      const res = await api.items.create({
        boardId,
        groupId: input.groupId,
        name: input.name,
        values: input.values,
      });
      if (!res.success) {
        showToast({
          variant: 'error',
          title: 'Could not create item',
          description: res.error ?? 'Unknown error',
        });
      }
      // Success path intentionally a no-op — WS echo appends the row.
    },
    [boardId, showToast]
  );

  const updateItemValue = useCallback(
    async (itemId: number, columnId: number, value: unknown) => {
      // Snapshot the prior value BEFORE the setItems call. Reading from
      // itemsRef instead of inside the updater avoids StrictMode's
      // double-invocation hazard described at the ref declaration.
      const snapshot = itemsRef.current;
      const priorCv = snapshot
        .find((i) => i.id === itemId)
        ?.columnValues?.find((c) => c.columnId === columnId);
      const priorValue = priorCv?.value;

      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const cvs = it.columnValues ?? [];
          const idx = cvs.findIndex((c) => c.columnId === columnId);
          const nextCvs =
            idx >= 0
              ? cvs.map((c) => (c.columnId === columnId ? { ...c, value } : c))
              : [...cvs, { id: -1, itemId, columnId, value } as unknown as ColumnValue];
          return { ...it, columnValues: nextCvs };
        })
      );

      const res = await api.items.updateValues(itemId, [{ columnId, value }]);
      if (!res.success) {
        // Roll back the optimistic update.
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== itemId) return it;
            const cvs = it.columnValues ?? [];
            const nextCvs = cvs.map((c) =>
              c.columnId === columnId ? { ...c, value: priorValue } : c
            );
            return { ...it, columnValues: nextCvs };
          })
        );
        showToast({
          variant: 'error',
          title: 'Could not update value',
          description: res.error ?? 'Unknown error',
        });
      }
    },
    [showToast]
  );

  const deleteItem = useCallback(
    async (itemId: number) => {
      // Snapshot via ref (StrictMode-safe — see updateItemValue comment).
      const snapshot = itemsRef.current;
      const removedIndex = snapshot.findIndex((i) => i.id === itemId);
      const removed = removedIndex >= 0 ? snapshot[removedIndex] : undefined;

      setItems((prev) => prev.filter((i) => i.id !== itemId));

      const res = await api.items.delete(itemId);
      if (!res.success) {
        // Re-insert at the original index so the UI doesn't re-order.
        if (removed) {
          const restored = removed;
          const restoredIndex = removedIndex;
          setItems((prev) => {
            const copy = [...prev];
            copy.splice(Math.max(0, restoredIndex), 0, restored);
            return copy;
          });
        }
        showToast({
          variant: 'error',
          title: 'Could not delete item',
          description: res.error ?? 'Unknown error',
        });
      }
    },
    [showToast]
  );

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
    createItem,
    updateItemValue,
    deleteItem,
  };
}
