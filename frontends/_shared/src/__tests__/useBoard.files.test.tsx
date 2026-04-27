// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';

/**
 * Slice 21A D2 — useBoard WebSocket file handlers.
 *
 * Verifies the `onFileCreated` / `onFileDeleted` callbacks registered
 * with `useWebSocket(boardId, callbacks)` correctly mutate the local
 * `items` state in response to socket echoes from Phase D1's backend
 * emit. The two-tab realtime contract: tab A uploads, tab B's
 * useBoard sees the file appear in the relevant column-value within
 * one render tick.
 *
 * The mock captures the callbacks object passed to `useWebSocket` so
 * tests can invoke `onFileCreated` / `onFileDeleted` directly — this
 * mirrors the pattern other realtime suites would use, but keeps us
 * out of the socket.io-client transport layer (covered by
 * configureWebSocket.test.ts).
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

// Capture the callbacks the hook hands to useWebSocket so each test
// can synthetically fire `onFileCreated` / `onFileDeleted`.
let capturedCallbacks: any = null;
vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: (_boardId: number, callbacks: any) => {
    capturedCallbacks = callbacks;
    return { isConnected: true };
  },
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
  return <span data-testid="item-count">{api.items.length}</span>;
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

// Two items with a files column-value seeded:
//   item 10 / cv 100 — files column 5, starts with one attachment
//   item 11 / cv 110 — files column 5, empty
const INITIAL_ITEMS = [
  {
    id: 10,
    boardId: 1,
    groupId: 1,
    name: 'First',
    position: 0,
    columnValues: [
      {
        id: 100,
        itemId: 10,
        columnId: 5,
        value: [
          {
            id: 7,
            itemId: 10,
            columnValueId: 100,
            workspaceId: 1,
            fileName: 'existing.pdf',
            originalName: 'existing.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
            filePath: '/tmp/existing.pdf',
            uploadedBy: 1,
          },
        ],
      },
    ],
  },
  {
    id: 11,
    boardId: 1,
    groupId: 1,
    name: 'Second',
    position: 1,
    columnValues: [{ id: 110, itemId: 11, columnId: 5, value: [] }],
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

function makeFile(over: Partial<{ id: number; itemId: number; columnValueId: number; originalName: string }>) {
  return {
    id: over.id ?? 1,
    itemId: over.itemId ?? null,
    columnValueId: over.columnValueId ?? null,
    workspaceId: 1,
    fileName: 'new.pdf',
    originalName: over.originalName ?? 'new.pdf',
    mimeType: 'application/pdf',
    fileSize: 2048,
    filePath: '/tmp/new.pdf',
    uploadedBy: 1,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('useBoard file WS handlers (Slice 21A D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallbacks = null;
    primeInitialLoad();
  });

  describe('onFileCreated', () => {
    it('appends the file to the matching column-value when columnValueId is set', async () => {
      const getApi = await mountBoard(1);
      const file = makeFile({ id: 8, itemId: 11, columnValueId: 110, originalName: 'fresh.pdf' });

      act(() => {
        capturedCallbacks.onFileCreated({ file, itemId: 11, columnValueId: 110 });
      });

      const item = getApi().items.find((i) => i.id === 11)!;
      const cv = item.columnValues!.find((c) => c.id === 110)!;
      expect(cv.value).toHaveLength(1);
      expect((cv.value as any[])[0].id).toBe(8);
      expect((cv.value as any[])[0].originalName).toBe('fresh.pdf');
    });

    it('is idempotent — duplicate file:created echo does not double-append', async () => {
      const getApi = await mountBoard(1);
      const file = makeFile({ id: 8, itemId: 11, columnValueId: 110 });

      act(() => {
        capturedCallbacks.onFileCreated({ file, itemId: 11, columnValueId: 110 });
      });
      act(() => {
        capturedCallbacks.onFileCreated({ file, itemId: 11, columnValueId: 110 });
      });

      const item = getApi().items.find((i) => i.id === 11)!;
      const cv = item.columnValues!.find((c) => c.id === 110)!;
      expect(cv.value).toHaveLength(1);
    });

    it('leaves unrelated items untouched (board scoping by itemId)', async () => {
      const getApi = await mountBoard(1);
      const file = makeFile({ id: 8, itemId: 11, columnValueId: 110 });

      act(() => {
        capturedCallbacks.onFileCreated({ file, itemId: 11, columnValueId: 110 });
      });

      const otherItem = getApi().items.find((i) => i.id === 10)!;
      const otherCv = otherItem.columnValues!.find((c) => c.id === 100)!;
      // item 10's existing file unchanged
      expect((otherCv.value as any[])).toHaveLength(1);
      expect((otherCv.value as any[])[0].id).toBe(7);
    });
  });

  describe('onFileDeleted', () => {
    it('removes the file from the matching column-value', async () => {
      const getApi = await mountBoard(1);

      act(() => {
        capturedCallbacks.onFileDeleted({ fileId: 7, itemId: 10, columnValueId: 100 });
      });

      const item = getApi().items.find((i) => i.id === 10)!;
      const cv = item.columnValues!.find((c) => c.id === 100)!;
      expect(cv.value).toHaveLength(0);
    });

    it('is idempotent — re-applying same file:deleted is a no-op', async () => {
      const getApi = await mountBoard(1);

      act(() => {
        capturedCallbacks.onFileDeleted({ fileId: 7, itemId: 10, columnValueId: 100 });
      });
      act(() => {
        capturedCallbacks.onFileDeleted({ fileId: 7, itemId: 10, columnValueId: 100 });
      });

      const item = getApi().items.find((i) => i.id === 10)!;
      const cv = item.columnValues!.find((c) => c.id === 100)!;
      expect(cv.value).toHaveLength(0);
    });
  });
});
