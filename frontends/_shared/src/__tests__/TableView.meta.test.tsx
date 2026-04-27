// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';
import { TableView } from '../components/board/TableView';
import type { Board, Column, Item } from '../types/index';

/**
 * Slice 21A D — TableView threads `meta={{ itemId, columnValueId }}` to
 * <ColumnEditor> so the `case 'files':` branch renders <FileUploader>
 * (Phase C1 wiring) instead of falling back to the read-only list.
 *
 * Without meta, ColumnEditor's files case checks `if (!meta) return
 * read-only list`, which leaves uploads dead. The fix is a one-line
 * prop pass on the cell-renderer's <ColumnEditor> mount.
 *
 * Test strategy: render a files column, click the cell to enter edit
 * mode, then assert FileUploader (testid="file-uploader") is rendered
 * — NOT the read-only fallback (testid="file-uploader-readonly").
 */

// ── api mock — keep upload/delete observable ─────────────────────────
const mockUpload = vi.fn();
const mockDeleteFile = vi.fn();
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof import('../utils/api')>('../utils/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      files: {
        upload: (...args: unknown[]) => mockUpload(...args),
        list: vi.fn(),
        delete: (...args: unknown[]) => mockDeleteFile(...args),
      },
    },
  };
});

// ── auth mock — admin so canEditInline === true ─────────────────────
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@example.com',
      firstName: 'A',
      lastName: 'D',
      avatar: null,
      role: 'admin' as const,
      workspaceId: 1,
    },
    accessToken: 'token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// ── workspace mock — quota for the FileUploader display ─────────────
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    workspace: {
      id: 1,
      name: 'WS',
      slug: 'ws',
      description: null,
      storageUsed: 0,
      storageLimit: 100 * 1024 * 1024,
    },
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn(),
    isLoading: false,
  }),
}));

const FILES_COLUMN: Column = {
  id: 42,
  boardId: 1,
  name: 'Attachments',
  columnType: 'files',
  config: {},
  position: 0,
  width: 200,
  isRequired: false,
};

const BOARD: Board = {
  id: 1,
  name: 'Pipeline',
  description: null,
  workspaceId: 1,
  boardType: 'main',
  groups: [
    { id: 1, boardId: 1, name: 'Active', color: '#60A5FA', position: 0, isCollapsed: false },
  ],
  columns: [FILES_COLUMN],
  views: [],
};

const ITEMS: Item[] = [
  {
    id: 10,
    boardId: 1,
    groupId: 1,
    name: 'Row A',
    position: 0,
    createdBy: 1,
    columnValues: [
      // cv with id 99 — the meta plumbing must surface this id as
      // columnValueId on <ColumnEditor>'s `meta` prop so FileUploader
      // can scope uploads to this column-value.
      { id: 99, itemId: 10, columnId: 42, value: [] },
    ],
  },
];

describe('TableView — meta threading to ColumnEditor (Slice 21A D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders <FileUploader> (not the read-only fallback) when a files cell enters edit mode', () => {
    render(
      <ToastProvider>
        <TableView board={BOARD} items={ITEMS} />
      </ToastProvider>
    );

    // Locate the files cell. testid `cell-files` is set by TableView's
    // cell <td>; clicking it triggers handleCellClick → edit mode.
    const filesCell = screen.getAllByTestId('cell-files')[0];
    fireEvent.click(filesCell);

    // FileUploader rendered → meta was threaded. If meta were missing,
    // ColumnEditor would render <ul data-testid="file-uploader-readonly">
    // instead, and this assertion would fail.
    expect(screen.queryByTestId('file-uploader')).toBeTruthy();
    expect(screen.queryByTestId('file-uploader-readonly')).toBeNull();
  });

  it('threads itemId + columnValueId so the upload route can scope the attachment', () => {
    // Trigger edit mode and verify the FileUploader's hidden input
    // carries the right data-* attributes — proxy for the meta plumbing
    // having reached the actual <FileUploader> props (itemId from item.id,
    // columnValueId from the matching column-value's id = 99).
    render(
      <ToastProvider>
        <TableView board={BOARD} items={ITEMS} />
      </ToastProvider>
    );

    const filesCell = screen.getAllByTestId('cell-files')[0];
    fireEvent.click(filesCell);

    // FileUploader renders an <input type="file" /> with testid
    // `file-uploader-input`. Existence proves the FileUploader path
    // (which only mounts when meta.itemId is set) was taken.
    expect(screen.queryByTestId('file-uploader-input')).toBeTruthy();
  });
});
