// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';
import { ColumnEditor } from '../components/board/ColumnEditor';
import type { Column } from '../types/index';

/**
 * Slice 21 review fix C1 — Rules of Hooks regression.
 *
 * Pre-fix, ColumnEditor's `case 'person':` and `case 'files':` blocks
 * called React hooks (useState, useEffect, useDebounce, useToast,
 * useWorkspace) inline inside switch arms. React tracks hook call
 * order across renders; if `column.columnType` changes between renders
 * of the SAME ColumnEditor instance, the hook-call sequence shifts and
 * React throws the "Rendered more hooks than during the previous
 * render" error (or, worse, silently corrupts component state).
 *
 * The fix extracts <PersonEditor> and <FilesEditor> as their own React
 * function components; the switch now calls them as JSX, so all hooks
 * inside them are unconditional from React's perspective.
 *
 * This test rerenders the same ColumnEditor instance with three
 * different column types in succession and asserts:
 *   1. No console.error from React hooks-order machinery
 *   2. The DOM updates without throwing
 *
 * Without the fix, the second rerender (text -> person) trips React's
 * hook-counter and prints a "Rendered more hooks" error.
 */

// Match the surface contract of useWorkspace + ToastProvider so the
// extracted PersonEditor / FilesEditor have the context they need
// without us mounting a full provider tree.
const mockUseWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => mockUseWorkspace(),
}));

// Stub api.workspaces.searchMembers so PersonEditor's effect doesn't
// fire a real network request (jsdom has no fetch by default).
const mockSearchMembers = vi.fn();
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof import('../utils/api')>(
    '../utils/api'
  );
  return {
    ...actual,
    api: {
      ...actual.api,
      workspaces: {
        ...actual.api.workspaces,
        searchMembers: (...args: unknown[]) => mockSearchMembers(...args),
      },
    },
  };
});

// FilesEditor renders <FileUploader>, which calls useCanEdit -> useAuth.
// Stub useCanEdit so we don't need a full AuthProvider tree for this
// regression test (the goal is hook-order, not RBAC plumbing).
vi.mock('../hooks/useCanEdit', () => ({
  useCanEdit: () => ({
    canCreateBoard: true,
    canCreateItem: true,
    canEditInline: true,
    canDelete: true,
  }),
}));

const TEXT_COL: Column = {
  id: 1,
  boardId: 1,
  name: 'Notes',
  columnType: 'text',
  config: {},
  position: 0,
  width: 200,
  isRequired: false,
};

const PERSON_COL: Column = {
  id: 2,
  boardId: 1,
  name: 'Owner',
  columnType: 'person',
  config: { allow_multiple: false },
  position: 1,
  width: 200,
  isRequired: false,
};

const FILES_COL: Column = {
  id: 3,
  boardId: 1,
  name: 'Attachments',
  columnType: 'files',
  config: {},
  position: 2,
  width: 200,
  isRequired: false,
};

describe('ColumnEditor — hooks-order regression (Slice 21 review C1)', () => {
  // The vitest MockInstance generic signature collides with the global
  // Console type when narrowed; using `any` here lets the spy track
  // calls without us bikeshedding the TS gymnastics. The spy is only
  // ever read via `mock.calls` which is loosely typed anyway.
  let errorSpy: any;

  beforeEach(() => {
    mockUseWorkspace.mockReturnValue({
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
    });
    mockSearchMembers.mockResolvedValue({
      success: true,
      data: { members: [] },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    cleanup();
    vi.clearAllMocks();
  });

  it('rerendering the same ColumnEditor with text -> person -> files does NOT log a React hooks-order error', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();

    const { rerender } = render(
      <ToastProvider>
        <ColumnEditor
          column={TEXT_COL}
          value=""
          onChange={onChange}
          onBlur={onBlur}
          meta={{ itemId: 1 }}
        />
      </ToastProvider>
    );

    // text -> person: pre-fix, this hop trips React's hook counter
    // because case 'person' calls hooks that case 'text' didn't.
    rerender(
      <ToastProvider>
        <ColumnEditor
          column={PERSON_COL}
          value={null}
          onChange={onChange}
          onBlur={onBlur}
          meta={{ itemId: 1 }}
        />
      </ToastProvider>
    );

    // person -> files: same risk in the other direction.
    rerender(
      <ToastProvider>
        <ColumnEditor
          column={FILES_COL}
          value={[]}
          onChange={onChange}
          onBlur={onBlur}
          meta={{ itemId: 1 }}
        />
      </ToastProvider>
    );

    // Walk every console.error call recorded across the 3 renders.
    // React's hook-counter error message starts with "Warning:
    // React has detected a change in the order of Hooks" or
    // "Rendered more hooks than during the previous render."
    const hookOrderCalls = errorSpy.mock.calls.filter((args: unknown[]) => {
      const msg = args.map((a: unknown) => String(a)).join(' ');
      return (
        msg.includes('change in the order of Hooks') ||
        msg.includes('Rendered more hooks than during the previous render') ||
        msg.includes('Rendered fewer hooks than expected')
      );
    });

    expect(hookOrderCalls).toEqual([]);
  });
});
