import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { deleteItem, loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 21C Phase E (Task E1) — Playwright E2E spec for TableView bulk
 * actions on the BulkActionBar surface (Slice 21C C1 → D wiring).
 *
 * Scope: 3 cases × 3 reference industries (NovaPay/MedVista/JurisPath)
 * = 9 tests.
 *
 *   Case 1 — Bulk delete: 2-tab WS echo. Tab A creates 3 items, selects,
 *     clicks Delete in BulkActionBar, confirms in ConfirmDialog. All 3
 *     rows disappear in tab A and (via per-item item:deleted echo from
 *     useBoard.bulkDelete → Promise.allSettled of N deleteItem calls)
 *     also disappear in tab B without reload, within 5s.
 *
 *   Case 2 — Bulk status update: single tab. 3 items seeded with
 *     options[0], select all 3, open the BulkActionBar status picker
 *     ("Change status"), pick options[1]. Assert all 3 rows show the
 *     new label and that the change persists across page reload.
 *
 *   Case 3 — Bulk Assign placeholder. 3 items seeded, select all 3,
 *     observe the "Assign" button is disabled with title="Coming soon"
 *     (Phase C1 placeholder per BulkActionBar.tsx — full picker
 *     integration deferred to a future minor slice). Assert clicking it
 *     emits no PUT /items/:id/values traffic, since the button is
 *     disabled and no mutation handler is wired.
 *
 * Determinism notes:
 *   - All items pre-created via REST so the test target is stable across
 *     the 3 industries' divergent seeded data. The board's primary
 *     Status column + its options[0] are resolved per-industry from
 *     GET /api/v1/boards/:id/full (mirrors Slice 20A inline-edit-status
 *     spec resolution).
 *   - afterEach REST-deletes any items that the test itself didn't
 *     consume (Case 1: nothing to clean since delete IS the test, but
 *     we still try-delete by id in case the test failed mid-flight).
 *   - Spec is gated on typecheck (cd e2e && npx tsc --noEmit) per the
 *     Slice 20A E3 / Slice 20.5 C1 pattern. Docker stack does not need
 *     to be running for the typecheck gate to pass.
 */

interface BoardMeta {
  id: number;
  firstGroupId: number;
  statusColumn: { id: number; options: { label: string; color: string }[] };
}

interface ItemCreateResponse {
  data?: { item?: { id: number } };
}

interface BoardListResponse {
  data?: { boards?: Array<{ id: number; name: string }> };
}

interface BoardFullResponse {
  data?: {
    board?: {
      id: number;
      columns?: Array<{
        id: number;
        columnType: string;
        config?: { options?: { label: string; color: string }[] };
      }>;
      groups?: Array<{ id: number }>;
    };
  };
}

async function resolvePrimaryBoard(
  page: Page,
  industry: IndustryFixture,
  accessToken: string
): Promise<BoardMeta> {
  const listRes = await page.request.get(`${API_BASE_URL}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok()) {
    throw new Error(
      `resolvePrimaryBoard(${industry.slug}) list failed: ${listRes.status()}`
    );
  }
  const body = (await listRes.json()) as BoardListResponse;
  const boards = body.data?.boards ?? [];
  const match = boards.find((b) => b.name === industry.primaryBoardName);
  if (!match) {
    throw new Error(
      `${industry.slug}: primary board "${industry.primaryBoardName}" not found. Got: ${boards
        .map((b) => b.name)
        .join(', ')}`
    );
  }
  const boardRes = await page.request.get(`${API_BASE_URL}/boards/${match.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const boardBody = (await boardRes.json()) as BoardFullResponse;
  const board = boardBody.data?.board;
  if (!board) throw new Error(`${industry.slug}: GET /boards/${match.id} empty`);
  const statusCol = (board.columns ?? []).find((c) => c.columnType === 'status');
  if (!statusCol) {
    throw new Error(`${industry.slug}: no status column on "${match.name}"`);
  }
  const options = statusCol.config?.options ?? [];
  if (options.length < 2) {
    throw new Error(
      `${industry.slug}: status column has < 2 options — can't exercise a status change`
    );
  }
  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) throw new Error(`${industry.slug}: no groups on board`);
  return {
    id: board.id,
    firstGroupId,
    statusColumn: { id: statusCol.id, options },
  };
}

/**
 * Create N items via REST against the primary board, optionally with a
 * shared initial Status value. Returns the created ids in creation
 * order so afterEach can clean up deterministically.
 */
async function createBulkItems(
  request: APIRequestContext,
  board: BoardMeta,
  accessToken: string,
  names: string[],
  initialStatus?: { label: string; color: string }
): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) {
    const values: Record<string, unknown> = {};
    if (initialStatus) {
      values[String(board.statusColumn.id)] = {
        label: initialStatus.label,
        color: initialStatus.color,
      };
    }
    const res = await request.post(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        boardId: board.id,
        groupId: board.firstGroupId,
        name,
        values,
      },
    });
    if (!res.ok()) {
      throw new Error(
        `createBulkItems failed for "${name}": ${res.status()} ${await res.text()}`
      );
    }
    const body = (await res.json()) as ItemCreateResponse;
    const id = body.data?.item?.id;
    if (typeof id !== 'number') {
      throw new Error(`createBulkItems: missing item.id in response for "${name}"`);
    }
    ids.push(id);
  }
  return ids;
}

// Cap to the 3 reference industries (matches the Slice 20A E2E coverage
// matrix — adding the other 7 would exercise the same shared BulkActionBar
// + useBoard.bulkDelete code path without new failure modes).
const REFERENCE = ['novapay', 'medvista', 'jurispath'];

for (const industry of selectedIndustries().filter((i) =>
  REFERENCE.includes(i.slug)
)) {
  test.describe(`Slice 21C E1 — Bulk actions on TableView (${industry.slug})`, () => {
    test.use({ baseURL: industry.baseURL });

    let accessToken: string | null = null;
    let createdItemIds: number[] = [];

    test.afterEach(async ({ page }) => {
      // Best-effort cleanup. Case 1 (bulk delete) consumes all 3 items
      // as the test target, so the DELETEs here will 404 — that's fine.
      if (accessToken) {
        for (const id of createdItemIds) {
          try {
            await deleteItem(page, id, accessToken);
          } catch {
            // best-effort
          }
        }
      }
      createdItemIds = [];
      accessToken = null;
    });

    test('Case 1 — bulk delete: confirm dialog removes 3 rows + WS echo to second tab', async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Deterministic suffix so concurrent runs don't collide on names.
      const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const names = [
        `Bulk-test-A-${suffix}`,
        `Bulk-test-B-${suffix}`,
        `Bulk-test-C-${suffix}`,
      ];
      createdItemIds = await createBulkItems(
        page.request,
        board,
        accessToken,
        names,
        board.statusColumn.options[0]
      );

      // Tab B is a separate context — fresh storageState — to validate
      // that the per-item item:deleted WS echo lands in a remote session
      // without a reload (useBoard.bulkDelete is Promise.allSettled of N
      // deleteItem calls; each emits item:deleted server-side).
      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();
      await loginAsAdmin(pageB, industry);

      await page.goto(`/boards/${board.id}`);
      await pageB.goto(`/boards/${board.id}`);

      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });
      await expect(pageB.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });

      // Both tabs see the 3 seeded rows before we mutate.
      for (const name of names) {
        await expect(page.getByText(name).first()).toBeVisible({
          timeout: 5_000,
        });
        await expect(pageB.getByText(name).first()).toBeVisible({
          timeout: 5_000,
        });
      }

      // Select the 3 rows in tab A by their per-row checkbox testid
      // (TableView renders `data-testid="row-checkbox-${item.id}"`).
      for (const id of createdItemIds) {
        await page.getByTestId(`row-checkbox-${id}`).check();
      }

      // BulkActionBar appears at the bottom with selection count "3".
      const bar = page.getByTestId('bulk-action-bar');
      await expect(bar).toBeVisible();
      await expect(bar).toContainText('3 selected');

      // Click Delete — a ConfirmDialog mounts (role="dialog", title
      // "Delete 3 items?"). Clicking the danger-variant Delete button
      // fires onBulkDelete which fans out N deleteItem calls.
      await bar.getByRole('button', { name: /^Delete$/ }).click();
      const dialog = page.getByRole('dialog', { name: /Delete 3 items\?/ });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /^Delete$/ }).click();

      // Tab A — all 3 rows gone within 3s (optimistic + REST settle).
      for (const name of names) {
        await expect
          .poll(async () => await page.getByText(name).count(), {
            timeout: 3_000,
            intervals: [100, 200, 300, 500],
          })
          .toBe(0);
      }

      // Tab B — observes the deletes via per-item item:deleted WS echo
      // within 5s, no reload. This is the load-bearing assertion that
      // the bulk path emits the same per-item events as single-delete.
      await expect
        .poll(
          async () => {
            let visible = 0;
            for (const name of names) {
              visible += await pageB.getByText(name).count();
            }
            return visible;
          },
          { timeout: 5_000, intervals: [200, 400, 600, 1000] }
        )
        .toBe(0);

      await ctxB.close();
    });

    test('Case 2 — bulk status update: 3 rows change to a new status and persist across reload', async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      const initial = board.statusColumn.options[0];
      const target = board.statusColumn.options[1];
      // Defensive: skip if the seed somehow gave us identical labels.
      test.skip(
        !initial ||
          !target ||
          initial.label === target.label,
        `${industry.slug}: status column lacks 2 distinct options for bulk update`
      );

      const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const names = [
        `Bulk-status-A-${suffix}`,
        `Bulk-status-B-${suffix}`,
        `Bulk-status-C-${suffix}`,
      ];
      createdItemIds = await createBulkItems(
        page.request,
        board,
        accessToken,
        names,
        initial
      );

      await page.goto(`/boards/${board.id}`);
      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });

      // Seed sanity: each row shows the initial status label.
      for (const name of names) {
        const row = page.locator('tr', { hasText: name });
        await expect(
          row.getByText(initial.label, { exact: true }).first()
        ).toBeVisible({ timeout: 5_000 });
      }

      // Select all 3 via per-row checkboxes.
      for (const id of createdItemIds) {
        await page.getByTestId(`row-checkbox-${id}`).check();
      }
      const bar = page.getByTestId('bulk-action-bar');
      await expect(bar).toBeVisible();
      await expect(bar).toContainText('3 selected');

      // Open the status picker — BulkActionBar renders this as the
      // "Change status" button which toggles a role="menu" dropdown.
      await bar.getByRole('button', { name: /Change status/ }).click();
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible();
      await menu.getByRole('menuitem', { name: target.label }).click();

      // All 3 rows reflect the new label within 3s (optimistic on
      // useBoard.bulkUpdateStatus).
      for (const name of names) {
        const row = page.locator('tr', { hasText: name });
        await expect(
          row.getByText(target.label, { exact: true }).first()
        ).toBeVisible({ timeout: 3_000 });
      }

      // Reload — the new status persists (server-side write succeeded
      // for every selected row).
      await page.reload();
      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });
      for (const name of names) {
        const row = page.locator('tr', { hasText: name });
        await expect(
          row.getByText(target.label, { exact: true }).first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });

    test('Case 3 — bulk Assign is a "Coming soon" placeholder, fires no mutations', async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const names = [
        `Bulk-assign-A-${suffix}`,
        `Bulk-assign-B-${suffix}`,
        `Bulk-assign-C-${suffix}`,
      ];
      createdItemIds = await createBulkItems(
        page.request,
        board,
        accessToken,
        names,
        board.statusColumn.options[0]
      );

      await page.goto(`/boards/${board.id}`);
      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });

      // Watch for unexpected PUT /items/:id/values traffic. Phase C1
      // ships Assign as a disabled placeholder — clicking it MUST NOT
      // fire any mutation against the column-values endpoint.
      const valueWrites: string[] = [];
      page.on('request', (req) => {
        if (
          req.method() === 'PUT' &&
          /\/api\/v1\/items\/\d+\/values$/.test(req.url())
        ) {
          valueWrites.push(req.url());
        }
      });

      // Select all 3 via per-row checkboxes.
      for (const id of createdItemIds) {
        await page.getByTestId(`row-checkbox-${id}`).check();
      }
      const bar = page.getByTestId('bulk-action-bar');
      await expect(bar).toBeVisible();
      await expect(bar).toContainText('3 selected');

      // Locate the Assign button. Per BulkActionBar.tsx (C1), it's
      // rendered with `title="Coming soon"` and `aria-disabled="true"`.
      const assign = bar.getByRole('button', { name: /Assign/ });
      await expect(assign).toBeVisible();
      await expect(assign).toHaveAttribute('title', 'Coming soon');
      await expect(assign).toBeDisabled();

      // Force-click bypasses Playwright's actionability gate so we
      // exercise the disabled handler path. A `disabled` button never
      // fires onClick in React, so this should be a no-op visually and
      // network-wise.
      await assign.click({ force: true }).catch(() => {
        // Some Playwright versions reject force-click on aria-disabled
        // even with `force`; either outcome is acceptable since the
        // load-bearing assertion below is the network silence.
      });

      // No row mutations fired. Use a small settle window so any racing
      // request would land before we assert.
      await page.waitForTimeout(500);
      expect(valueWrites).toEqual([]);

      // Selection count and rows are unchanged after the no-op click.
      await expect(bar).toContainText('3 selected');
      for (const name of names) {
        await expect(page.getByText(name).first()).toBeVisible();
      }
    });
  });
}
