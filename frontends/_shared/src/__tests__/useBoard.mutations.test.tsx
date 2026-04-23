// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';

/**
 * useBoard mutation contract tests (Slice 20 A3).
 *
 * The hook under test owns the local item list + wraps api.items.* so
 * industry App shells get a single call-site for CRUD. This suite proves:
 *
 *   1. create calls the REST endpoint but does NOT mutate local state
 *      — the Socket.io echo (already wired in useBoard) is responsible
 *      for appending the new item, avoiding double-append.
 *   2. updateItemValue applies optimistically and rolls back on failure.
 *   3. deleteItem removes optimistically and re-inserts on failure.
 *   4. Every failure path emits an error toast instead of silently
 *      swallowing — lifts the "silent catch" pattern Slice 19.7 caught.
 *   5. The mutation callbacks are stable references so memoised children
 *      (FormView, KanbanLane) don't re-render for every parent update.
 *
 * Mocks:
 *   - api (the typed client from A2) — each method is a spy.
 *   - useWebSocket — no-op stub returning { isConnected: true }.
 *     The real-time echo path is tested in useBoard's existing realtime
 *     suite, not here.
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
  return (
    <div>
      <span data-testid="item-count">{api.items.length}</span>
      <span data-testid="error">{api.error ?? ''}</span>
    </div>
  );
}

async function mountBoard(boardId = 1) {
  let latest!: Api;
  render(
    <ToastProvider>
      <Harness boardId={boardId} onReady={(a) => (latest = a)} />
    </ToastProvider>
  );
  // Wait until the initial GET /boards/:id + GET /boards/:id/items effects
  // resolve so tests start from a known-loaded state.
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
    name: 'First item',
    position: 0,
    columnValues: [{ id: 100, itemId: 10, columnId: 5, value: 'Old' }],
  },
  {
    id: 11,
    boardId: 1,
    groupId: 1,
    name: 'Second item',
    position: 1,
    columnValues: [],
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

describe('useBoard mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeInitialLoad();
  });

  afterEach(() => {
    // Toast provider uses document-level keydown listener — cleanup via
    // RTL happens automatically when the component unmounts. No timer
    // mocking here because toast auto-close is not under test in A3.
  });

  describe('createItem', () => {
    it('calls api.items.create with { boardId, groupId, name, values }', async () => {
      const getApi = await mountBoard(1);
      mockCreate.mockResolvedValue({
        success: true,
        data: { item: { id: 12, boardId: 1, groupId: 1, name: 'New', position: 0 } },
      });

      await act(async () => {
        await getApi().createItem({ groupId: 1, name: 'New', values: { 5: 'Fresh' } });
      });

      expect(mockCreate).toHaveBeenCalledWith({
        boardId: 1,
        groupId: 1,
        name: 'New',
        values: { 5: 'Fresh' },
      });
    });

    it('does NOT mutate local state on success — waits for Socket.io echo', async () => {
      const getApi = await mountBoard(1);
      mockCreate.mockResolvedValue({
        success: true,
        data: { item: { id: 12, boardId: 1, groupId: 1, name: 'New', position: 0 } },
      });

      await act(async () => {
        await getApi().createItem({ groupId: 1, name: 'New' });
      });

      // Local list unchanged — the real-time onItemCreated handler
      // (tested separately) is what appends.
      expect(getApi().items).toHaveLength(INITIAL_ITEMS.length);
    });

    it('emits error toast when api returns success: false', async () => {
      const getApi = await mountBoard(1);
      mockCreate.mockResolvedValue({
        success: false,
        error: 'Name is required',
      });

      await act(async () => {
        await getApi().createItem({ groupId: 1, name: '' });
      });

      expect(screen.getByText(/Name is required/i)).toBeTruthy();
    });
  });

  describe('updateItemValue', () => {
    it('optimistically updates the local cell before the request resolves', async () => {
      const getApi = await mountBoard(1);
      // Make the request never resolve during this test so we can observe
      // pre-resolution state.
      let resolveRequest!: (v: unknown) => void;
      mockUpdateValues.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
      );

      act(() => {
        void getApi().updateItemValue(10, 5, { label: 'New', color: '#34D399' });
      });

      // Find the updated item — its columnValue for column 5 should now
      // be the new label/color, before the request completes.
      const item = getApi().items.find((i) => i.id === 10)!;
      const cv = item.columnValues!.find((c) => c.columnId === 5)!;
      expect(cv.value).toEqual({ label: 'New', color: '#34D399' });

      // Resolve in-flight request so afterEach cleanup doesn't leak.
      await act(async () => {
        resolveRequest({ success: true, data: { values: [] } });
      });
    });

    it('calls api.items.updateValues with { columnId, value } wrapping', async () => {
      const getApi = await mountBoard(1);
      mockUpdateValues.mockResolvedValue({ success: true, data: { values: [] } });

      await act(async () => {
        await getApi().updateItemValue(10, 5, 'Done');
      });

      expect(mockUpdateValues).toHaveBeenCalledWith(10, [
        { columnId: 5, value: 'Done' },
      ]);
    });

    it('rolls back to the prior value when the server returns an error', async () => {
      const getApi = await mountBoard(1);
      mockUpdateValues.mockResolvedValue({
        success: false,
        error: 'Invalid value',
      });

      await act(async () => {
        await getApi().updateItemValue(10, 5, 'Forbidden');
      });

      const item = getApi().items.find((i) => i.id === 10)!;
      const cv = item.columnValues!.find((c) => c.columnId === 5)!;
      expect(cv.value).toBe('Old'); // rolled back to initial seed value
      expect(screen.getByText(/Invalid value/i)).toBeTruthy();
    });
  });

  describe('deleteItem', () => {
    it('removes the item from local state optimistically', async () => {
      const getApi = await mountBoard(1);
      let resolveRequest!: (v: unknown) => void;
      mockDelete.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
      );

      act(() => {
        void getApi().deleteItem(10);
      });

      expect(getApi().items.find((i) => i.id === 10)).toBeUndefined();

      await act(async () => {
        resolveRequest({ success: true });
      });
    });

    it('calls api.items.delete with the itemId', async () => {
      const getApi = await mountBoard(1);
      mockDelete.mockResolvedValue({ success: true });

      await act(async () => {
        await getApi().deleteItem(10);
      });

      expect(mockDelete).toHaveBeenCalledWith(10);
    });

    it('re-inserts the item when the server returns an error', async () => {
      const getApi = await mountBoard(1);
      mockDelete.mockResolvedValue({
        success: false,
        error: 'Cannot delete',
      });

      await act(async () => {
        await getApi().deleteItem(10);
      });

      // The original item must be back in the list after rollback.
      expect(getApi().items.some((i) => i.id === 10)).toBe(true);
      expect(screen.getByText(/Cannot delete/i)).toBeTruthy();
    });
  });

  describe('reference stability', () => {
    it('mutation callbacks are stable across re-renders', async () => {
      const getApi = await mountBoard(1);
      const firstRefs = {
        createItem: getApi().createItem,
        updateItemValue: getApi().updateItemValue,
        deleteItem: getApi().deleteItem,
      };

      // Trigger a re-render by firing a no-op refresh.
      await act(async () => {
        await getApi().refreshItems();
      });

      expect(getApi().createItem).toBe(firstRefs.createItem);
      expect(getApi().updateItemValue).toBe(firstRefs.updateItemValue);
      expect(getApi().deleteItem).toBe(firstRefs.deleteItem);
    });
  });
});
