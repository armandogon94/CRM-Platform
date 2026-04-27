import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { deleteItem, loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 21A Phase E (E1) — File-cell E2E coverage across 3 reference
 * industries (NovaPay/MedVista/JurisPath), three behaviours each:
 *
 *   1. Admin uploads file → surfaces in cell + survives reload
 *   2. Viewer sees no drop zone, only the read-only file list
 *   3. Two-tab WS echo (`file:created`) — tab B sees tab A's upload
 *      without reloading, exercising the Slice 21A D1 backend emit and
 *      the D2 useBoard onFileCreated handler.
 *
 * Mirrors:
 *   - e2e/specs/slice-20/realtime-echo.spec.ts (two-context echo)
 *   - e2e/specs/slice-20/rbac-viewer.spec.ts (inline loginAsViewer helper)
 *   - e2e/specs/slice-20/inline-edit-status.spec.ts (REST-create item then
 *     drive the cell's ColumnEditor on the rendered Table view).
 *
 * Determinism strategy:
 *   - REST POST /items creates a fresh row per test so the Files cell
 *     starts empty (or with a known seeded file when tested for viewer
 *     read-only mode).
 *   - We resolve the Files-typed column off the seeded board via REST
 *     GET /boards/:id (its `columns` array carries `columnType: 'files'`
 *     entries). If no such column exists, `test.skip` is fired with a
 *     clear reason — we DO NOT mutate the seed schema to satisfy a
 *     missing column.
 *   - The hidden `<input type=file>` (data-testid `file-uploader-input`)
 *     accepts `setInputFiles({ name, mimeType, buffer })` directly, so
 *     no on-disk fixture is needed — we ship a 5-byte in-memory buffer.
 *
 * afterEach REST cleanup:
 *   - DELETE /items/:id (cascades soft-delete to associated FileAttachment
 *     rows in 21A B-stage backend cleanup; if it ever doesn't, we also
 *     issue DELETE /files/:id for any captured file id).
 *
 * Constraint (matches Slice 20A E3 / 20.5 C1): the ship gate is
 * `cd e2e && npx tsc --noEmit` clean — Docker stack may not be running,
 * so this file is NOT exercised live, only typechecked.
 */

// Constrain to the 3 reference industries (matches realtime-echo.spec.ts'
// REALTIME_INDUSTRIES rationale: post-Slice-21A every shared cell flows
// through ColumnEditor + FileUploader, so the 7 other shells exercise no
// new code paths).
const REFERENCE = ['novapay', 'medvista', 'jurispath'];

interface BoardMeta {
  id: number;
  filesColumnId: number;
  firstGroupId: number;
}

interface ResolvedFilesBoard {
  meta: BoardMeta | null;
  reason: string | null;
}

async function resolveFilesBoard(
  page: Page,
  industry: IndustryFixture,
  accessToken: string
): Promise<ResolvedFilesBoard> {
  const listRes = await page.request.get(`${API_BASE_URL}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok()) {
    return { meta: null, reason: `GET /boards ${listRes.status()}` };
  }
  const listBody = (await listRes.json()) as {
    data?: { boards?: Array<{ id: number; name: string }> };
  };
  const match = (listBody.data?.boards ?? []).find(
    (b) => b.name === industry.primaryBoardName
  );
  if (!match) {
    return {
      meta: null,
      reason: `${industry.slug}: primary board "${industry.primaryBoardName}" not found`,
    };
  }
  const boardRes = await page.request.get(
    `${API_BASE_URL}/boards/${match.id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!boardRes.ok()) {
    return { meta: null, reason: `GET /boards/${match.id} ${boardRes.status()}` };
  }
  const boardBody = (await boardRes.json()) as {
    data?: {
      board?: {
        id: number;
        columns?: Array<{ id: number; columnType: string }>;
        groups?: Array<{ id: number }>;
      };
    };
  };
  const board = boardBody.data?.board;
  if (!board) {
    return { meta: null, reason: `${industry.slug}: empty board response` };
  }
  const filesCol = (board.columns ?? []).find((c) => c.columnType === 'files');
  if (!filesCol) {
    return {
      meta: null,
      reason: `${industry.slug}: seed has no Files-type column on "${match.name}" — DO NOT mutate seed; skipping`,
    };
  }
  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) {
    return { meta: null, reason: `${industry.slug}: no groups on board` };
  }
  return {
    meta: { id: board.id, filesColumnId: filesCol.id, firstGroupId },
    reason: null,
  };
}

interface ViewerLogin {
  accessToken: string;
}

/**
 * Inline viewer login — copied from rbac-viewer.spec.ts. Returns null on
 * failure so the spec can `test.skip` when the seed lacks a viewer user.
 */
async function loginAsViewer(
  page: Page,
  industry: IndustryFixture
): Promise<ViewerLogin | null> {
  const email = `viewer@${industry.slug}.com`;
  const res = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: 'demo123' },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as {
    success: boolean;
    data?: { accessToken: string };
  };
  if (!body.success || !body.data) return null;
  await page.addInitScript(
    ({ key, token }: { key: string; token: string }) => {
      window.localStorage.setItem(key, token);
    },
    { key: industry.tokenKey, token: body.data.accessToken }
  );
  return { accessToken: body.data.accessToken };
}

interface CreatedItem {
  id: number;
  name: string;
}

async function createItem(
  page: Page,
  board: BoardMeta,
  accessToken: string,
  name: string
): Promise<CreatedItem> {
  const res = await page.request.post(`${API_BASE_URL}/items`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      boardId: board.id,
      groupId: board.firstGroupId,
      name,
      values: {},
    },
  });
  expect(res.ok(), `POST /items ${res.status()}`).toBe(true);
  const body = (await res.json()) as {
    data?: { item?: { id: number; name: string } };
  };
  const item = body.data?.item;
  if (!item) throw new Error(`POST /items returned no item`);
  return { id: item.id, name: item.name };
}

interface UploadedFile {
  id: number;
  originalName: string;
}

async function uploadFileViaRest(
  page: Page,
  itemId: number,
  columnValueId: number | undefined,
  accessToken: string,
  fileName: string
): Promise<UploadedFile> {
  // Playwright's `multipart` field accepts a string-keyed map of either
  // primitive values OR { name, mimeType, buffer } file shapes — the
  // union is captured inline (rather than as Record<string, unknown>) so
  // strict TS doesn't widen us out of the file-shape branch.
  const multipart: {
    [key: string]:
      | string
      | { name: string; mimeType: string; buffer: Buffer };
  } = {
    itemId: String(itemId),
    file: {
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    },
  };
  if (typeof columnValueId === 'number') {
    multipart.columnValueId = String(columnValueId);
  }
  const res = await page.request.post(`${API_BASE_URL}/files/upload`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    multipart,
  });
  expect(res.ok(), `POST /files/upload ${res.status()}`).toBe(true);
  const body = (await res.json()) as {
    data?: { file?: { id: number; originalName: string } };
  };
  const file = body.data?.file;
  if (!file) throw new Error(`POST /files/upload returned no file`);
  return { id: file.id, originalName: file.originalName };
}

async function deleteFileViaRest(
  page: Page,
  fileId: number,
  accessToken: string
): Promise<void> {
  // Best-effort cleanup — DELETE /items already cascades, but a defensive
  // call here keeps a stranded FileAttachment row from polluting the seed
  // if the cascade ever regresses.
  await page.request
    .delete(`${API_BASE_URL}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .catch(() => undefined);
}

/**
 * Open the ColumnEditor for the Files cell of `itemName` on Table view.
 * The shared TableView wraps each cell as a clickable container that
 * mounts ColumnEditor on click; the Files-cell case in ColumnEditor
 * (Slice 21A C1) renders a `<FileUploader />` carrying our well-known
 * data-testid set ("file-uploader" / "file-uploader-input" / etc).
 */
async function openFilesCell(page: Page, itemName: string): Promise<void> {
  await expect(page.getByTestId('table-view')).toBeVisible({ timeout: 10_000 });
  const row = page.locator('tr', { hasText: itemName });
  await expect(row).toBeVisible({ timeout: 5_000 });
  // The cell that carries the Files column renders an empty placeholder
  // when there are no files. Click the row's last data cell area; if the
  // FileUploader doesn't mount, fall back to clicking any cell that, on
  // mount, triggers the editor. We trigger by clicking the cells one by
  // one until the uploader appears (cheaper than parsing column ids).
  const cells = row.locator('td');
  const count = await cells.count();
  for (let i = 0; i < count; i += 1) {
    await cells.nth(i).click({ trial: false }).catch(() => undefined);
    const uploader = page.getByTestId('file-uploader');
    if ((await uploader.count()) > 0) {
      return;
    }
    // Press Escape to dismiss the wrong editor before trying the next cell.
    await page.keyboard.press('Escape').catch(() => undefined);
  }
  throw new Error(`Files cell never mounted FileUploader for row "${itemName}"`);
}

for (const industry of selectedIndustries().filter((i) =>
  REFERENCE.includes(i.slug)
)) {
  test.describe(`File uploads — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`admin uploads file → cell shows it + persists across reload`, async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const resolved = await resolveFilesBoard(page, industry, accessToken);
      test.skip(resolved.meta === null, resolved.reason ?? 'no files column');
      const board = resolved.meta!;

      const itemName = `Slice21A-E1-upload-${industry.slug}-${Date.now()}`;
      const created = await createItem(page, board, accessToken, itemName);
      let uploadedFileId: number | null = null;

      try {
        await page.goto(`/boards/${board.id}`);
        await openFilesCell(page, itemName);

        // Drive the hidden file input — `setInputFiles` accepts an
        // in-memory buffer so we don't need a fixture file on disk.
        const input = page.getByTestId('file-uploader-input');
        const fileName = `demo-${Date.now()}.txt`;
        await input.setInputFiles({
          name: fileName,
          mimeType: 'text/plain',
          buffer: Buffer.from('hello'),
        });

        // The uploaded filename must surface inside the cell within 5s.
        // FileUploader renders each file as an `<a>` carrying the
        // originalName text inside `data-testid=file-uploader-list`.
        const list = page.getByTestId('file-uploader-list');
        await expect(list.getByText(fileName, { exact: true })).toBeVisible({
          timeout: 5_000,
        });

        // Reload — verify persistence end-to-end (DB write + render path).
        await page.reload();
        await openFilesCell(page, itemName);
        const listAfterReload = page.getByTestId('file-uploader-list');
        await expect(
          listAfterReload.getByText(fileName, { exact: true })
        ).toBeVisible({ timeout: 10_000 });

        // Capture the file id off the REST listing so afterEach cleanup
        // can target it explicitly if the item-cascade regresses.
        const filesRes = await page.request.get(
          `${API_BASE_URL}/files?itemId=${created.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (filesRes.ok()) {
          const body = (await filesRes.json()) as {
            data?: { files?: Array<{ id: number; originalName: string }> };
          };
          const found = (body.data?.files ?? []).find(
            (f) => f.originalName === fileName
          );
          if (found) uploadedFileId = found.id;
        }
      } finally {
        if (uploadedFileId !== null) {
          await deleteFileViaRest(page, uploadedFileId, accessToken);
        }
        await deleteItem(page, created.id, accessToken).catch(() => undefined);
      }
    });

    test(`viewer sees no drop zone — read-only file list, no delete buttons`, async ({
      page,
    }) => {
      // We need an admin session FIRST to seed an item with a pre-uploaded
      // file (so the viewer has something read-only to see). Then we swap
      // to viewer auth via a fresh page load.
      const adminSession = await loginAsAdmin(page, industry);
      const adminToken = adminSession.accessToken;
      const resolved = await resolveFilesBoard(page, industry, adminToken);
      test.skip(resolved.meta === null, resolved.reason ?? 'no files column');
      const board = resolved.meta!;

      const itemName = `Slice21A-E1-viewer-${industry.slug}-${Date.now()}`;
      const created = await createItem(page, board, adminToken, itemName);
      const fileName = `viewer-seed-${Date.now()}.txt`;
      let seededFileId: number | null = null;

      try {
        const uploaded = await uploadFileViaRest(
          page,
          created.id,
          undefined,
          adminToken,
          fileName
        );
        seededFileId = uploaded.id;

        // Now log in as viewer in the same page context (addInitScript
        // overwrites the token under industry.tokenKey for subsequent
        // navigations).
        const viewer = await loginAsViewer(page, industry);
        test.skip(
          viewer === null,
          `${industry.slug}: viewer@${industry.slug}.com login failed — seed may not have one`
        );

        await page.goto(`/boards/${board.id}`);
        await openFilesCell(page, itemName);

        // 1. The drop zone (visible to admins) must NOT render for viewer.
        await expect(
          page.getByTestId('file-uploader-dropzone')
        ).toHaveCount(0, { timeout: 3_000 });

        // 2. The read-only file row IS visible. Two render paths exist:
        //    - canEditInline=false on FileUploader still renders the
        //      file list (`file-uploader-list` ul).
        //    - If meta is undefined, ColumnEditor falls back to
        //      `file-uploader-readonly`.
        //    Either should expose the filename text.
        const filenameVisible = page.getByText(fileName, { exact: true });
        await expect(filenameVisible.first()).toBeVisible({ timeout: 5_000 });

        // 3. No delete affordance on existing file rows for viewers.
        await expect(
          page.getByRole('button', { name: new RegExp(`Delete ${fileName}`) })
        ).toHaveCount(0, { timeout: 3_000 });
      } finally {
        if (seededFileId !== null) {
          await deleteFileViaRest(page, seededFileId, adminToken);
        }
        await deleteItem(page, created.id, adminToken).catch(() => undefined);
      }
    });

    test(`tab B sees file:created from tab A within 5s (WS echo)`, async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const resolved = await resolveFilesBoard(page, industry, accessToken);
      test.skip(resolved.meta === null, resolved.reason ?? 'no files column');
      const board = resolved.meta!;

      const itemName = `Slice21A-E1-echo-${industry.slug}-${Date.now()}`;
      const created = await createItem(page, board, accessToken, itemName);
      let uploadedFileId: number | null = null;

      // Open tab B as a separate context — fresh storageState, simulates
      // a second user agent on the same board room. useBoard subscribes
      // via configureWebSocket+useWebSocket; D2 wired onFileCreated to
      // append the new file shape to the matching column-value.
      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();

      try {
        await loginAsAdmin(pageB, industry);

        await page.goto(`/boards/${board.id}`);
        await pageB.goto(`/boards/${board.id}`);

        await expect(page.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });
        await expect(pageB.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });

        // Tab A: open the Files cell + drive setInputFiles. The optimistic
        // update is local to tab A; what we actually care about is whether
        // tab B observes the new filename WITHOUT reloading.
        await openFilesCell(page, itemName);
        const fileName = `echo-${Date.now()}.txt`;
        await page.getByTestId('file-uploader-input').setInputFiles({
          name: fileName,
          mimeType: 'text/plain',
          buffer: Buffer.from('hello'),
        });

        // Tab B: poll for the filename to appear anywhere on the page —
        // the WS echo + useBoard onFileCreated lands the new file shape
        // on the matching column-value, and the table cell re-renders
        // with the file's originalName visible. 5s timeout matches the
        // SPEC §Slice 21A success criterion (echo within 2-5s).
        await expect
          .poll(
            async () => await pageB.getByText(fileName, { exact: true }).count(),
            { timeout: 5_000, intervals: [200, 300, 500, 1000] }
          )
          .toBeGreaterThan(0);

        // Capture the file id for cleanup — best effort.
        const filesRes = await page.request.get(
          `${API_BASE_URL}/files?itemId=${created.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (filesRes.ok()) {
          const body = (await filesRes.json()) as {
            data?: { files?: Array<{ id: number; originalName: string }> };
          };
          const found = (body.data?.files ?? []).find(
            (f) => f.originalName === fileName
          );
          if (found) uploadedFileId = found.id;
        }
      } finally {
        if (uploadedFileId !== null) {
          await deleteFileViaRest(page, uploadedFileId, accessToken);
        }
        await deleteItem(page, created.id, accessToken).catch(() => undefined);
        await ctxB.close();
      }
    });
  });
}
