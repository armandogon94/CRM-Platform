import React, { useCallback, useRef, useState } from 'react';
import { api, type FileAttachment } from '../../utils/api';
import { useToast } from '../common/ToastProvider';
import { useCanEdit } from '../../hooks/useCanEdit';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * FileUploader — Slice 21A B1 + B2.
 *
 * Drives the five-state machine described in SPEC §Slice 21A:
 *
 *   idle        ─ drop target visible + existing file list rendered
 *   hovering    ─ user is dragging a file over the drop zone
 *   uploading   ─ XHR in flight; progress bar bound to api.files.upload's
 *                 onProgress callback (the percent value comes from the
 *                 XHR.upload.onprogress event inside uploadWithProgress)
 *   success     ─ 1s flash after onUploaded fires (visual confirmation)
 *   error       ─ toast emitted via useToast(); state immediately resumes
 *                 to idle so the next drop is still accepted
 *
 * Per ADR 21A-1, the helper that wraps XMLHttpRequest lives in
 * `utils/api.ts`. This component never touches XHR directly — it only
 * receives a percent-callback so the upload mechanics stay swappable
 * (e.g. resumable uploads in a future slice).
 *
 * The component is the source of truth for client-side guards (quota
 * projection + MIME whitelist). The server still 413s authoritatively;
 * the client guards exist to:
 *   - avoid wasting bandwidth on a doomed upload, and
 *   - give faster feedback than a network round-trip would.
 *
 * Viewer role (`useCanEdit().canEditInline === false`) renders read-only:
 * file list visible, no drop zone, no delete buttons. The underlying
 * routes still 403 server-side — the UI is just the affordance gate.
 */

// ─── MIME whitelist (mirrors the server-side allowlist in
// backend/src/routes/files.ts). Keep in sync if either side changes —
// drift would let the client allow uploads the server rejects.
//
// Slice 21 review I2 — image types are listed individually (no
// `image/*` prefix) so SVG (image/svg+xml) is excluded by construction.
// SVG is XML and can embed <script> tags; allowing it here would
// silently let the picker green-light an upload the server now
// rejects. Listing safe raster formats explicitly keeps the two
// sides aligned.
const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/zip',
  'application/json',
  // Office Open XML formats
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
]);

function isMimeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

// `accept` attribute on <input type="file"> — browser-level filter shown
// in the system file picker. The whitelist still runs after the user
// picks a file (some browsers ignore `accept`, and drag-drop bypasses
// the picker entirely).
//
// Slice 21 review I2 — image MIMEs enumerated individually instead of
// `image/*` so the system picker doesn't offer SVG to the user.
const ACCEPT_ATTR = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/zip',
  'application/json',
  '.xlsx',
  '.docx',
  '.pptx',
].join(',');

export type UploadState = 'idle' | 'hovering' | 'uploading' | 'success' | 'error';

export interface FileUploaderProps {
  itemId: number;
  columnValueId?: number;
  files: FileAttachment[];
  workspaceStorage: { used: number; limit: number };
  onUploaded?: (file: FileAttachment) => void;
  onDeleted?: (fileId: number) => void;
}

interface UploadResponseShape {
  success: boolean;
  data?: { file: FileAttachment };
  error?: string;
}

export function FileUploader({
  itemId,
  columnValueId,
  files,
  workspaceStorage,
  onUploaded,
  onDeleted,
}: FileUploaderProps) {
  const toast = useToast();
  const { canEditInline, canDelete } = useCanEdit();
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [pendingDelete, setPendingDelete] = useState<FileAttachment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // MIME whitelist runs first — cheap check, surfaces a clear message
      // for the common "user dropped an .exe by accident" case.
      if (!isMimeAllowed(file.type)) {
        return 'File type not allowed';
      }
      // Quota projection — the server is still authoritative on race
      // conditions, but the client check avoids the round trip on
      // obviously-doomed uploads.
      if (workspaceStorage.used + file.size > workspaceStorage.limit) {
        return 'Workspace storage quota would be exceeded';
      }
      return null;
    },
    [workspaceStorage.used, workspaceStorage.limit]
  );

  const startUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast.show({ variant: 'error', title: validationError });
        return;
      }

      setState('uploading');
      setProgress(0);

      try {
        const response = (await api.files.upload(
          file,
          { itemId, columnValueId },
          (percent: number) => setProgress(percent)
        )) as UploadResponseShape;

        if (response.success && response.data?.file) {
          onUploaded?.(response.data.file);
          setState('success');
          // Brief success flash before returning to idle. 1s matches the
          // spec's render-state machine description.
          setTimeout(() => setState('idle'), 1000);
        } else {
          // Rare but possible: server returns 2xx with success:false.
          // Treat as a soft error — toast the message, return to idle.
          toast.show({
            variant: 'error',
            title: response.error || 'Upload failed',
          });
          setState('idle');
        }
      } catch (err) {
        // uploadWithProgress rejects with { status, message } on 4xx/5xx.
        // The 413 case (quota race) lands here just like any other server
        // error.
        const message =
          (err as { message?: string } | null)?.message || 'Upload failed';
        toast.show({ variant: 'error', title: message });
        setState('idle');
      }
    },
    [itemId, columnValueId, onUploaded, toast, validateFile]
  );

  // ── drag-and-drop handlers ────────────────────────────────────────
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!canEditInline) return;
      setState((prev) => (prev === 'idle' ? 'hovering' : prev));
    },
    [canEditInline]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Required to allow drop — the browser default is to reject.
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!canEditInline) return;
      setState((prev) => (prev === 'hovering' ? 'idle' : prev));
    },
    [canEditInline]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!canEditInline) return;
      const dropped = Array.from(e.dataTransfer?.files ?? []);
      if (dropped.length === 0) {
        setState('idle');
        return;
      }
      // Single-file upload per drop — multi-file is Slice 22 scope.
      void startUpload(dropped[0]);
    },
    [canEditInline, startUpload]
  );

  // ── click-to-pick handler ─────────────────────────────────────────
  const handleClickPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void startUpload(file);
      }
      // Reset so the same file picked twice still triggers change.
      e.target.value = '';
    },
    [startUpload]
  );

  // ── delete with confirm dialog ────────────────────────────────────
  const requestDelete = useCallback((file: FileAttachment) => {
    setPendingDelete(file);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const fileId = pendingDelete.id;
    setPendingDelete(null);
    try {
      const response = await api.files.delete(fileId);
      if (response?.success) {
        onDeleted?.(fileId);
      } else {
        toast.show({
          variant: 'error',
          title: response?.error || 'Failed to delete file',
        });
      }
    } catch (err) {
      const message =
        (err as { message?: string } | null)?.message || 'Failed to delete file';
      toast.show({ variant: 'error', title: message });
    }
  }, [pendingDelete, onDeleted, toast]);

  // ── render ────────────────────────────────────────────────────────
  const stateClass =
    state === 'hovering'
      ? 'border-blue-500 border-4 bg-blue-50'
      : state === 'uploading'
      ? 'border-blue-300 border-2 bg-blue-50'
      : state === 'success'
      ? 'border-green-500 border-2 bg-green-50'
      : 'border-gray-300 border-2 border-dashed bg-white';

  return (
    <div data-testid="file-uploader" data-state={state} className="space-y-2">
      {canEditInline && (
        <div
          data-testid="file-uploader-dropzone"
          className={`p-4 rounded-md text-center cursor-pointer transition-colors ${stateClass}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickPick}
          role="button"
          tabIndex={0}
        >
          {state === 'uploading' ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-gray-700">Uploading… {progress}%</span>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : state === 'success' ? (
            <span className="text-sm text-green-700">Upload complete</span>
          ) : (
            <span className="text-sm text-gray-700">
              Drop file or click to upload
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={handleInputChange}
            data-testid="file-uploader-input"
          />
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1" data-testid="file-uploader-list">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-50 text-sm"
            >
              <a
                href={`/api/v1/files/${file.id}/download`}
                className="text-blue-600 hover:underline truncate"
              >
                {file.originalName}
              </a>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => requestDelete(file)}
                  aria-label={`Delete ${file.originalName}`}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete file?"
        description={
          pendingDelete
            ? `${pendingDelete.originalName} will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

export default FileUploader;
