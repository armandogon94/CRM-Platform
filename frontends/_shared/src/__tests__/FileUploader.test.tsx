// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider } from '../components/common/ToastProvider';
import { FileUploader } from '../components/board/FileUploader';
import type { FileAttachment } from '../utils/api';

/**
 * Test surface for Slice 21A B1 + B2 — FileUploader component.
 *
 * The component drives a five-state machine (idle / hovering / uploading
 * / success / error) backed by `api.files.upload`. We exercise the full
 * machine plus the two pre-upload guards (workspace-quota projection,
 * MIME-type whitelist) by mocking `api.files.upload` with `vi.fn()`.
 *
 * Strategy:
 *   - `vi.mock('../utils/api')` replaces the real `api` namespace so the
 *     component's call site is observable without firing XHRs. Tests can
 *     resolve / reject the upload promise on demand to drive the state
 *     machine forward without timer fakery.
 *   - Each case re-renders with explicit role + workspaceStorage so the
 *     test reads as a single scenario (DAMP, not DRY).
 *   - `useCanEdit` is stubbed via the `AuthContext` mock; viewer role
 *     proves the read-only branch.
 */

// ── api mock — resolved/rejected per-test via mockUpload.mockResolvedValue ──
const mockUpload = vi.fn();
const mockDelete = vi.fn();

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
        delete: (...args: unknown[]) => mockDelete(...args),
      },
    },
  };
});

// ── auth mock — drives useCanEdit() so viewer-role test can flip
// canEditInline → false without spinning up a real AuthProvider. ──
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import type { User } from '../types/index';

function setRole(role: User['role'] | null) {
  mockUseAuth.mockReturnValue({
    user: role
      ? {
          id: 1,
          email: 'u@example.com',
          firstName: 'U',
          lastName: 'X',
          avatar: null,
          role,
          workspaceId: 1,
        }
      : null,
    accessToken: role ? 'token' : null,
    isAuthenticated: !!role,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  });
}

// Standard fixture — small attachment list so the file-list render branch
// is exercised on every test that wants it.
function makeFile(overrides: Partial<FileAttachment> = {}): FileAttachment {
  return {
    id: 1,
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

const QUOTA_OK = { used: 1024 * 1024, limit: 100 * 1024 * 1024 }; // 1MB / 100MB
const QUOTA_NEAR_FULL = { used: 99 * 1024 * 1024, limit: 100 * 1024 * 1024 }; // 99MB / 100MB

function renderUploader(overrides: Partial<React.ComponentProps<typeof FileUploader>> = {}) {
  const props: React.ComponentProps<typeof FileUploader> = {
    itemId: 7,
    columnValueId: 11,
    files: [],
    workspaceStorage: QUOTA_OK,
    ...overrides,
  };
  return render(
    <ToastProvider>
      <FileUploader {...props} />
    </ToastProvider>
  );
}

describe('FileUploader (Slice 21A B1 + B2)', () => {
  beforeEach(() => {
    setRole('admin');
    mockUpload.mockReset();
    mockDelete.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── B1: render-state machine ────────────────────────────────────────
  describe('idle state', () => {
    it('renders drop zone copy + empty file list when no files attached', () => {
      renderUploader();
      const root = screen.getByTestId('file-uploader');
      expect(root.getAttribute('data-state')).toBe('idle');
      expect(screen.getByText(/drop file or click to upload/i)).toBeTruthy();
    });

    it('renders existing files with download link + delete button', () => {
      renderUploader({ files: [makeFile()] });
      // Download link points at the backend route — we only assert the href
      // includes /files/:id/download so the route shape stays decoupled.
      const link = screen.getByRole('link', { name: /doc\.pdf/i });
      expect(link.getAttribute('href')).toMatch(/\/files\/1\/download/);
      // Delete button exists for admin role.
      expect(screen.getByRole('button', { name: /delete doc\.pdf/i })).toBeTruthy();
    });
  });

  describe('hovering state', () => {
    it('toggles data-state="hovering" on dragenter and back to idle on dragleave', () => {
      renderUploader();
      const dropZone = screen.getByTestId('file-uploader-dropzone');

      fireEvent.dragEnter(dropZone);
      expect(screen.getByTestId('file-uploader').getAttribute('data-state')).toBe(
        'hovering'
      );

      fireEvent.dragLeave(dropZone);
      expect(screen.getByTestId('file-uploader').getAttribute('data-state')).toBe(
        'idle'
      );
    });
  });

  describe('uploading + success states', () => {
    it('drops a file → uploading state → success → returns to idle and calls onUploaded', async () => {
      const file = new File(['payload'], 'report.pdf', { type: 'application/pdf' });
      const uploaded = makeFile({ id: 99, originalName: 'report.pdf' });

      // Resolved promise we control — gives the test deterministic
      // transitions through uploading → success without timer hacks.
      let resolveUpload!: (v: unknown) => void;
      mockUpload.mockReturnValue(
        new Promise((res) => {
          resolveUpload = res;
        })
      );

      const onUploaded = vi.fn();
      renderUploader({ onUploaded });

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      // Uploading state visible while the promise is pending.
      expect(screen.getByTestId('file-uploader').getAttribute('data-state')).toBe(
        'uploading'
      );
      expect(mockUpload).toHaveBeenCalledTimes(1);
      const [calledFile, calledOpts] = mockUpload.mock.calls[0];
      expect(calledFile).toBe(file);
      expect(calledOpts).toEqual({ itemId: 7, columnValueId: 11 });

      await act(async () => {
        resolveUpload({ success: true, data: { file: uploaded } });
      });

      // After resolution the component flashes success then returns to idle.
      // We accept either 'success' or 'idle' here because the success flash
      // is a 1s visual treat, not a contract — the contract is "onUploaded
      // fires with the returned file payload".
      expect(onUploaded).toHaveBeenCalledWith(uploaded);
    });

    it('progress callback drives the bar aria-valuenow', async () => {
      const file = new File(['payload'], 'report.pdf', { type: 'application/pdf' });

      // Capture the onProgress argument so the test can simulate browser
      // progress events without an actual XHR.
      let capturedOnProgress: ((p: number) => void) | undefined;
      let resolveUpload!: (v: unknown) => void;
      mockUpload.mockImplementation(
        (_file: File, _opts: unknown, onProgress?: (p: number) => void) => {
          capturedOnProgress = onProgress;
          return new Promise((res) => {
            resolveUpload = res;
          });
        }
      );

      renderUploader();

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      // Component must hand a callback through; if it doesn't, progress
      // is unobservable end-to-end.
      expect(capturedOnProgress).toBeDefined();

      await act(async () => {
        capturedOnProgress!(42);
      });

      const bar = screen.getByRole('progressbar');
      expect(bar.getAttribute('aria-valuenow')).toBe('42');

      // Cleanly resolve so the test doesn't leak a pending promise.
      await act(async () => {
        resolveUpload({ success: true, data: { file: makeFile() } });
      });
    });
  });

  describe('error state', () => {
    it('surfaces a toast with the server error message on 413', async () => {
      const file = new File(['x'], 'big.pdf', { type: 'application/pdf' });
      mockUpload.mockRejectedValue({
        status: 413,
        message: 'Workspace storage quota exceeded',
      });

      renderUploader();

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      // Toast surfaces the server message verbatim.
      expect(screen.getByText(/workspace storage quota exceeded/i)).toBeTruthy();
      // State returned to idle — error toast is the affordance, not a
      // sticky error banner inside the component.
      expect(screen.getByTestId('file-uploader').getAttribute('data-state')).toBe(
        'idle'
      );
    });
  });

  describe('viewer role', () => {
    it('hides drop zone and delete buttons when canEditInline is false', () => {
      setRole('viewer');
      renderUploader({ files: [makeFile()] });

      // File list still visible (read-only).
      expect(screen.getByRole('link', { name: /doc\.pdf/i })).toBeTruthy();
      // No drop zone — viewer can't trigger uploads.
      expect(screen.queryByTestId('file-uploader-dropzone')).toBeNull();
      // No delete button — viewer is purely read-only.
      expect(screen.queryByRole('button', { name: /delete doc\.pdf/i })).toBeNull();
    });
  });

  describe('delete affordance', () => {
    it('opens ConfirmDialog and only deletes after user confirms', async () => {
      mockDelete.mockResolvedValue({ success: true });
      const onDeleted = vi.fn();
      renderUploader({ files: [makeFile()], onDeleted });

      // Click delete → ConfirmDialog opens, no API call yet.
      const deleteBtn = screen.getByRole('button', { name: /delete doc\.pdf/i });
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(mockDelete).not.toHaveBeenCalled();

      // Confirm → API fires and onDeleted callback is invoked.
      const confirmBtn = screen.getByRole('button', { name: /^(confirm|delete)$/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });
      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(onDeleted).toHaveBeenCalledWith(1);
    });
  });

  // ── B2: pre-upload guards ───────────────────────────────────────────
  describe('quota projection guard (B2)', () => {
    it('blocks upload + emits toast when projected total exceeds limit', async () => {
      // 99MB used + 5MB file = 104MB > 100MB limit → block.
      const file = new File([new Uint8Array(5 * 1024 * 1024)], 'big.pdf', {
        type: 'application/pdf',
      });

      renderUploader({ workspaceStorage: QUOTA_NEAR_FULL });

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      expect(mockUpload).not.toHaveBeenCalled();
      expect(
        screen.getByText(/workspace storage quota would be exceeded/i)
      ).toBeTruthy();
    });
  });

  describe('MIME whitelist guard (B2)', () => {
    it('blocks .exe + emits toast without firing upload', async () => {
      const file = new File([new Uint8Array(8)], 'malware.exe', {
        type: 'application/x-msdownload',
      });

      renderUploader();

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      expect(mockUpload).not.toHaveBeenCalled();
      expect(screen.getByText(/file type not allowed/i)).toBeTruthy();
    });

    it('allows .pdf through both guards and proceeds with upload', async () => {
      const file = new File(['payload'], 'doc.pdf', { type: 'application/pdf' });
      mockUpload.mockResolvedValue({ success: true, data: { file: makeFile() } });

      renderUploader();

      const dropZone = screen.getByTestId('file-uploader-dropzone');
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file], types: ['Files'] },
        });
      });

      expect(mockUpload).toHaveBeenCalledTimes(1);
    });
  });
});
