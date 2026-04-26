// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';
import { ColumnEditor } from '../components/board/ColumnEditor';
import type { Column } from '../types/index';
import type { FileAttachment } from '../utils/api';

/**
 * Slice 21A — Phase C1: ColumnEditor `case 'files':` wiring.
 *
 * The Files column type was previously falling through to the default
 * text input. C1 wires `<FileUploader>` into the switch with the cell's
 * current files mapped to `files`, the item's id propagated as `itemId`,
 * and the column-value's id passed (when present) so the upload route
 * can scope the attachment.
 *
 * Optimistic updates: `onUploaded` callback appends the new attachment
 * to the cell value and fires `onChange()` so the row state reconciles
 * before the WS echo lands. `onDeleted` mirrors that path with a
 * filter-by-id.
 */

// ── api mock — keep upload/delete observable + frozen ─────────────────
const mockUpload = vi.fn();
const mockDeleteFile = vi.fn();
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof import('../utils/api')>(
    '../utils/api'
  );
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

// ── auth mock — admin role so canEditInline === true ─────────────────
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function setAdmin() {
  mockUseAuth.mockReturnValue({
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
  });
}

// ── workspace mock — exposes storageUsed/storageLimit so the files
// case can derive the quota budget from context. The plan's brief is
// explicit that ColumnEditor reads workspace storage from useWorkspace,
// not from a per-cell prop. ──
const mockUseWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => mockUseWorkspace(),
}));

function setWorkspace(storageUsed = 0, storageLimit = 100 * 1024 * 1024) {
  mockUseWorkspace.mockReturnValue({
    workspace: {
      id: 1,
      name: 'WS',
      slug: 'ws',
      description: null,
      storageUsed,
      storageLimit,
    },
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn(),
    isLoading: false,
  });
}

const FILES_COLUMN: Column = {
  id: 42,
  boardId: 1,
  name: 'Attachments',
  columnType: 'files',
  config: {},
  position: 5,
  width: 200,
  isRequired: false,
};

function makeFile(overrides: Partial<FileAttachment> = {}): FileAttachment {
  return {
    id: 100,
    itemId: 7,
    columnValueId: 11,
    workspaceId: 1,
    fileName: 'hash-doc.pdf',
    originalName: 'doc.pdf',
    mimeType: 'application/pdf',
    fileSize: 2048,
    filePath: '/uploads/hash-doc.pdf',
    uploadedBy: 1,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    ...overrides,
  };
}

function renderEditor(props: {
  value: any;
  onChange?: (v: any) => void;
}) {
  const onChange = props.onChange ?? vi.fn();
  return render(
    <ToastProvider>
      <ColumnEditor
        column={FILES_COLUMN}
        value={props.value}
        onChange={onChange}
        meta={{ itemId: 7, columnValueId: 11 }}
      />
    </ToastProvider>
  );
}

describe('ColumnEditor — files case (Slice 21A C1)', () => {
  beforeEach(() => {
    setAdmin();
    setWorkspace();
    mockUpload.mockReset();
    mockDeleteFile.mockReset();
  });

  it('renders <FileUploader> for column.columnType === "files" with current files', () => {
    const file = makeFile({ id: 200, originalName: 'spec.pdf' });
    renderEditor({ value: [file] });

    // FileUploader exposes a stable testid so the wiring is observable
    // without coupling the test to internal markup.
    expect(screen.getByTestId('file-uploader')).toBeTruthy();
    // Existing file rendered in the list.
    expect(screen.getByRole('link', { name: /spec\.pdf/i })).toBeTruthy();
  });

  it('falls back to an empty list when cell value is null/undefined', () => {
    renderEditor({ value: null });

    expect(screen.getByTestId('file-uploader')).toBeTruthy();
    // No file rows when value is empty — list element is conditionally rendered.
    expect(screen.queryByTestId('file-uploader-list')).toBeNull();
  });

  it('onUploaded → appends file to value and calls onChange with the new array', async () => {
    const file = new File(['payload'], 'report.pdf', { type: 'application/pdf' });
    const uploaded = makeFile({ id: 999, originalName: 'report.pdf' });

    let resolveUpload!: (v: unknown) => void;
    mockUpload.mockReturnValue(
      new Promise((res) => {
        resolveUpload = res;
      })
    );

    const onChange = vi.fn();
    renderEditor({ value: [], onChange });

    const dropZone = screen.getByTestId('file-uploader-dropzone');
    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file], types: ['Files'] },
      });
    });

    await act(async () => {
      resolveUpload({ success: true, data: { file: uploaded } });
    });

    // onChange fires with the appended file — wire-in contract.
    expect(onChange).toHaveBeenCalledWith([uploaded]);
  });

  it('onDeleted → filters file from value and calls onChange with the trimmed array', async () => {
    mockDeleteFile.mockResolvedValue({ success: true });
    const file1 = makeFile({ id: 100, originalName: 'a.pdf' });
    const file2 = makeFile({ id: 101, originalName: 'b.pdf' });

    const onChange = vi.fn();
    renderEditor({ value: [file1, file2], onChange });

    const deleteBtn = screen.getByRole('button', { name: /delete a\.pdf/i });
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    // Confirm dialog confirm button.
    const confirmBtn = screen.getByRole('button', { name: /^(confirm|delete)$/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(onChange).toHaveBeenCalledWith([file2]);
  });
});
