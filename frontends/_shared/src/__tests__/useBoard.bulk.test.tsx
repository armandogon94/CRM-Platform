// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';

/**
 * useBoard bulk wrapper contract tests (Slice 21C A1).
 *
 * The wrappers fan-out per-item mutations via Promise.all. They MUST:
 *   1. Delegate to the existing per-item mutations (deleteItem,
 *      updateItemValue) so optimistic update + rollback + per-item toasts
 *      already wired in Slice 20 A3 still fire — no duplicate toast logic.
 *   2. Return { succeeded, failed } counts so the caller (BulkActionBar)
 *      can render an aggregate toast only when it has UI context.
 *   3. Be no-ops on empty `ids[]` — no network, no toast.
 *   4. Hold stable references across re-renders (useCallback deps correct).
 *
 * Mocks:
 *   - api (the typed client) — each method is a spy.
 *   - useWebSocket — no-op stub returning { isConnected: true }.
 */

// ── Mocks ────────────────────────────────────────────────────────────────

const mockGet = vi.fn();
const mockCreate = vi.fn();
const mockUpdateValues = vi.fn();
const mockDelete = vi.fn();

vi.mock('../utils/api', () => {
  const mockApi = {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    items: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: vi.fn(),
      updateValues: (...args: unknown[]) => mockUpdateValues(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    boards: { create: vi.fn() },
  };
  return { api: mockApi, default: mockApi, configureApi: vi.fn() };
});

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ isConnected: true }),
}));

import { useBoard } from '../hooks/useBoard';

// ── Test harness ─────────────────────────────────────────────────────────

type Api = ReturnType<typeof useBoard>;

function Harness({
  boardId,
  onReady,
}: {
  boardId: number;
  onReady: (api: Api) => void;
}) {
  const api = useBoard(boardId);
  React.useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

async function mountBoard(boardId = 1) {
  let latest!: Api;
  render(
    <ToastProvider>
      <Harness boardId={boardId} onReady={(a) => (latest = a)} />
    </ToastProvider>
  );
  await waitFor(() => expect(latest.loading).toBe(false));
  return () => latest;
}

const INITIAL_BOARD = {
  id: 1,
  name: 'Pipeline',
  description: null,
  workspaceId: 1,
  boardType: 'main',
  groups: [],
  columns: [],
  views: [],
};

const INITIAL_ITEMS = [
  {
    id: 10,
    boardId: 1,
    groupId: 1,
    name: 'A',
    position: 0,
    columnValues: [{ id: 100, itemId: 10, columnId: 5, value: 'Old' }],
  },
  {
    id: 11,
    boardId: 1,
    groupId: 1,
    name: 'B',
    position: 1,
    columnValues: [{ id: 101, itemId: 11, columnId: 5, value: 'Old' }],
  },
  {
    id: 12,
    boardId: 1,
    groupId: 1,
    name: 'C',
    position: 2,
    columnValues: [{ id: 102, itemId: 12, columnId: 5, value: 'Old' }],
  },
];

function primeInitialLoad() {
  mockGet.mockImplementation(async (url: string) => {
    if (url.includes('/items')) {
      return { success: true, data: { items: INITIAL_ITEMS } };
    }
    return { success: true, data: { board: INITIAL_BOARD } };
  });
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('useBoard bulk wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeInitialLoad();
  });

  describe('bulkDelete', () => {
    it('calls deleteItem N times and returns { succeeded: N, failed: 0 } on full success', async () => {
      const getApi = await mountBoard(1);
      mockDelete.mockResolvedValue({ success: true });

      let result!: { succeeded: number; failed: number };
      await act(async () => {
        result = await getApi().bulkDelete([10, 11, 12]);
      });

      expect(mockDelete).toHaveBeenCalledTimes(3);
      expect(mockDelete).toHaveBeenCalledWith(10);
      expect(mockDelete).toHaveBeenCalledWith(11);
      expect(mockDelete).toHaveBeenCalledWith(12);
      expect(result).toEqual({ succeeded: 3, failed: 0 });
    });

    it('returns { succeeded: 2, failed: 1 } and rolls back the failed item', async () => {
      const getApi = await mountBoard(1);
      // Item 11 fails; items 10 and 12 succeed.
      mockDelete.mockImplementation(async (itemId: number) => {
        if (itemId === 11) return { success: false, error: 'Cannot delete' };
        return { success: true };
      });

      let result!: { succeeded: number; failed: number };
      await act(async () => {
        result = await getApi().bulkDelete([10, 11, 12]);
      });

      expect(result).toEqual({ succeeded: 2, failed: 1 });
      // Per-item rollback fires for the failed item — item 11 is back in
      // the local list because the per-item mutation re-inserted it.
      expect(getApi().items.some((i) => i.id === 11)).toBe(true);
      // The successes are gone.
      expect(getApi().items.some((i) => i.id === 10)).toBe(false);
      expect(getApi().items.some((i) => i.id === 12)).toBe(false);
    });
  });

  describe('bulkUpdateValue', () => {
    it('calls updateItemValue with same (columnId, value) for each id', async () => {
      const getApi = await mountBoard(1);
      mockUpdateValues.mockResolvedValue({ success: true, data: { values: [] } });

      let result!: { succeeded: number; failed: number };
      await act(async () => {
        result = await getApi().bulkUpdateValue([10, 11, 12], 5, {
          label: 'Done',
          color: '#34D399',
        });
      });

      expect(mockUpdateValues).toHaveBeenCalledTimes(3);
      expect(mockUpdateValues).toHaveBeenCalledWith(10, [
        { columnId: 5, value: { label: 'Done', color: '#34D399' } },
      ]);
      expect(mockUpdateValues).toHaveBeenCalledWith(11, [
        { columnId: 5, value: { label: 'Done', color: '#34D399' } },
      ]);
      expect(mockUpdateValues).toHaveBeenCalledWith(12, [
        { columnId: 5, value: { label: 'Done', color: '#34D399' } },
      ]);
      expect(result).toEqual({ succeeded: 3, failed: 0 });
    });
  });

  describe('bulkAssign', () => {
    it('delegates to updateItemValue with userIds payload for each id', async () => {
      const getApi = await mountBoard(1);
      mockUpdateValues.mockResolvedValue({ success: true, data: { values: [] } });

      let result!: { succeeded: number; failed: number };
      await act(async () => {
        result = await getApi().bulkAssign([10, 11], 7, [42, 99]);
      });

      // Person column shape — object with userIds array.
      expect(mockUpdateValues).toHaveBeenCalledTimes(2);
      expect(mockUpdateValues).toHaveBeenCalledWith(10, [
        { columnId: 7, value: { userIds: [42, 99] } },
      ]);
      expect(mockUpdateValues).toHaveBeenCalledWith(11, [
        { columnId: 7, value: { userIds: [42, 99] } },
      ]);
      expect(result).toEqual({ succeeded: 2, failed: 0 });
    });
  });

  describe('empty input', () => {
    it('bulkDelete([]) returns { succeeded: 0, failed: 0 } without calling api', async () => {
      const getApi = await mountBoard(1);

      let result!: { succeeded: number; failed: number };
      await act(async () => {
        result = await getApi().bulkDelete([]);
      });

      expect(mockDelete).not.toHaveBeenCalled();
      expect(result).toEqual({ succeeded: 0, failed: 0 });
    });
  });

  describe('reference stability', () => {
    it('bulk wrappers are stable across re-renders', async () => {
      const getApi = await mountBoard(1);
      const firstRefs = {
        bulkDelete: getApi().bulkDelete,
        bulkUpdateValue: getApi().bulkUpdateValue,
        bulkAssign: getApi().bulkAssign,
      };

      // Trigger a re-render via no-op refresh.
      await act(async () => {
        await getApi().refreshItems();
      });

      expect(getApi().bulkDelete).toBe(firstRefs.bulkDelete);
      expect(getApi().bulkUpdateValue).toBe(firstRefs.bulkUpdateValue);
      expect(getApi().bulkAssign).toBe(firstRefs.bulkAssign);
    });
  });
});
