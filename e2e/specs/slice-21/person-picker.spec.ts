import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { loginAsAdmin, deleteItem } from '../../helpers/slice-20-login';

/**
 * Slice 21B Phase D1 — Person picker E2E.
 *
 * Three cases × three reference industries (NovaPay/MedVista/JurisPath):
 *
 *   1. Single-assign: open picker, type a query, click a result, assert
 *      the cell renders the chosen avatar/name in tab A AND tab B sees
 *      the assignment land via WS within 2-5s — this validates the
 *      Slice 20.5 column:value:updated echo continues to fan out for
 *      person-typed values now that 21B C1 swapped the free-text stub
 *      for a real workspace lookup.
 *   2. Multi-assign: add two chips, X-out the first, reload, assert
 *      exactly the second chip persists. Skipped per-industry when no
 *      `allow_multiple: true` person column exists in seed (the 3
 *      reference industries currently expose only single-assign).
 *   3. Viewer role: cell is readable but click does NOT mount the
 *      search dropdown. Skipped if viewer login fails (seed gap).
 *
 * Mirrors the slice-20 patterns:
 *   - REST-driven setup/teardown (loginAsAdmin + DELETE /items/:id) so
 *     the picker UI is the only thing under test.
 *   - Two-context fan-out for the WS echo case copies realtime-echo's
 *     browser.newContext() recipe — same admin in both contexts means
 *     same workspace + same Socket.io room.
 *   - loginAsViewer is inlined (mirrors rbac-viewer.spec.ts) — no shared
 *     helper exists yet, and inlining keeps Phase D1 strictly to one
 *     spec file (anti-collision discipline).
 *
 * Constraint: typecheck-only ship gate. The Docker stack is not
 * required to be running for the gate to pass — `cd e2e && npx tsc
 * --noEmit` clean is the bar. Live Playwright execution is deferred to
 * the make-target orchestrator.
 */

const REFERENCE = ['novapay', 'medvista', 'jurispath'];

interface PersonColumn {
  id: number;
  name: string;
  multi: boolean;
}

interface BoardMeta {
  id: number;
  firstGroupId: number;
  singlePersonColumn: PersonColumn | null;
  multiPersonColumn: PersonColumn | null;
}

interface ViewerSession {
  accessToken: string;
}

/**
 * Resolve the primary board for an industry and classify its person
 * columns (single- vs multi-assign). Returns nulls when no person
 * column of a given variant is seeded — callers `test.skip` rather
 * than mutate the seed.
 */
async function resolveBoardWithPersonColumns(
  page: Parameters<typeof loginAsAdmin>[0],
  industry: IndustryFixture,
  accessToken: string
): Promise<BoardMeta> {
  const listRes = await page.request.get(`${API_BASE_URL}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const listBody = (await listRes.json()) as {
    data?: { boards?: Array<{ id: number; name: string }> };
  };
  const match = (listBody.data?.boards ?? []).find(
    (b) => b.name === industry.primaryBoardName
  );
  if (!match) throw new Error(`${industry.slug}: primary board not found`);

  const boardRes = await page.request.get(`${API_BASE_URL}/boards/${match.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const boardBody = (await boardRes.json()) as {
    data?: {
      board?: {
        id: number;
        columns?: Array<{
          id: number;
          name: string;
          columnType: string;
          config?: { allow_multiple?: boolean };
        }>;
        groups?: Array<{ id: number }>;
      };
    };
  };
  const board = boardBody.data?.board;
  if (!board) throw new Error(`${industry.slug}: GET /boards/${match.id} empty`);

  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) throw new Error(`${industry.slug}: no groups on board`);

  const personCols = (board.columns ?? []).filter(
    (c) => c.columnType === 'person'
  );
  const singlePersonColumn =
    personCols.find((c) => c.config?.allow_multiple !== true) ?? null;
  const multiPersonColumn =
    personCols.find((c) => c.config?.allow_multiple === true) ?? null;

  return {
    id: board.id,
    firstGroupId,
    singlePersonColumn: singlePersonColumn
      ? { id: singlePersonColumn.id, name: singlePersonColumn.name, multi: false }
      : null,
    multiPersonColumn: multiPersonColumn
      ? { id: multiPersonColumn.id, name: multiPersonColumn.name, multi: true }
      : null,
  };
}

/**
 * Mirrors the loginAsViewer pattern from rbac-viewer.spec.ts — POST to
 * /auth/login as viewer@<slug>.com, stash the token under the industry's
 * tokenKey via addInitScript so the AuthContext mounts authenticated.
 * Returns null on failure (seed gap or wrong creds) so callers can
 * `test.skip` cleanly.
 */
async function loginAsViewer(
  page: Parameters<typeof loginAsAdmin>[0],
  industry: IndustryFixture
): Promise<ViewerSession | null> {
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

for (const industry of selectedIndustries().filter((i) =>
  REFERENCE.includes(i.slug)
)) {
  test.describe(`Person picker — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`single-assign: search → click → cell renders chip; tab B sees WS echo`, async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolveBoardWithPersonColumns(
        page,
        industry,
        accessToken
      );

      test.skip(
        board.singlePersonColumn === null,
        `${industry.slug}: no single-assign person column on primary board`
      );

      // Seed a deterministic item with no assignee — the test will
      // populate the person cell via the picker UI.
      const itemName = `Slice21B-D1-single-${industry.slug}-${Date.now()}`;
      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values: {},
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const itemId = created.data?.item?.id;
      if (!itemId) throw new Error('item create returned no id');

      // Tab B: separate context, same admin, same board → same WS room.
      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();
      await loginAsAdmin(pageB, industry);

      try {
        await page.goto(`/boards/${board.id}`);
        await pageB.goto(`/boards/${board.id}`);

        await expect(page.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });
        await expect(pageB.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });

        const rowA = page.getByTestId(`row-${itemId}`);
        const rowB = pageB.getByTestId(`row-${itemId}`);
        await expect(rowA).toBeVisible();
        await expect(rowB).toBeVisible();

        // Click the Person cell on tab A — picker dropdown should mount.
        const personCellA = rowA.getByTestId('cell-person').first();
        await personCellA.click();

        const searchInput = page.getByPlaceholder(/search by name or email/i);
        await expect(searchInput).toBeVisible({ timeout: 5_000 });

        // Type "ad" — matches "admin@<slug>.com" in seed plus debounce.
        await searchInput.fill('ad');

        // First result button: ColumnEditor renders each member as a
        // <button> sibling of the search input; the role-based locator
        // is stable across single- vs multi-assign (no chips yet).
        const firstResult = page
          .locator('button')
          .filter({ has: page.locator('img, [class*="rounded-full"]') })
          .first();
        await expect(firstResult).toBeVisible({ timeout: 5_000 });
        await firstResult.click();

        // Tab A: chip/avatar should render in the cell within 3s.
        await expect
          .poll(
            async () => await rowA.getByTestId('cell-person').first().textContent(),
            { timeout: 3_000, intervals: [100, 200, 300, 500] }
          )
          .toMatch(/.+/);

        // Tab B: WS echo — the cell content should reflect the assignment
        // within 2-5s without a reload. We assert the cell contains a
        // non-empty rendered avatar/name. (`column:value:updated` emit is
        // wired by Slice 20.5; the picker just feeds it.)
        const cellPersonB = rowB.getByTestId('cell-person').first();
        await expect
          .poll(
            async () => {
              const text = await cellPersonB.textContent();
              return (text ?? '').trim().length;
            },
            { timeout: 5_000, intervals: [200, 400, 600, 1000] }
          )
          .toBeGreaterThan(0);
      } finally {
        await deleteItem(page, itemId, accessToken);
        await ctxB.close();
      }
    });

    test(`multi-assign: add 2 chips, X out 1, reload — exactly 1 persists`, async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolveBoardWithPersonColumns(
        page,
        industry,
        accessToken
      );

      test.skip(
        board.multiPersonColumn === null,
        `${industry.slug}: no multi-assign person column on primary board (allow_multiple=true)`
      );

      const itemName = `Slice21B-D1-multi-${industry.slug}-${Date.now()}`;
      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values: {},
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const itemId = created.data?.item?.id;
      if (!itemId) throw new Error('item create returned no id');

      try {
        await page.goto(`/boards/${board.id}`);
        await expect(page.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });
        const row = page.getByTestId(`row-${itemId}`);
        await expect(row).toBeVisible();

        // Open picker.
        await row.getByTestId('cell-person').first().click();
        const searchInput = page.getByPlaceholder(/search by name or email/i);
        await expect(searchInput).toBeVisible({ timeout: 5_000 });

        // First add: search "ad" → click first member.
        await searchInput.fill('ad');
        const firstAddTarget = page
          .locator('button')
          .filter({ has: page.locator('img, [class*="rounded-full"]') })
          .first();
        await expect(firstAddTarget).toBeVisible({ timeout: 5_000 });
        await firstAddTarget.click();

        // First chip should appear; capture its name for the post-X
        // assertion. ColumnEditor renders chips as inline-flex spans
        // with an "Remove <name>" aria-labelled X button.
        const firstRemoveBtn = page.getByRole('button', {
          name: /^Remove /i,
        });
        await expect(firstRemoveBtn).toHaveCount(1, { timeout: 3_000 });

        // Second add: clear and search a different prefix to surface
        // a different member. The picker stays open in multi-mode.
        await searchInput.fill('');
        await searchInput.fill('vi');
        // Wait for the debounce + fetch to update results.
        await page.waitForTimeout(500);
        // The first non-disabled list button after the chip + search
        // input is the next add target. Filter to those that are NOT
        // chip-X buttons and NOT already-disabled.
        const nextAddTarget = page
          .locator('button:not([disabled])')
          .filter({ hasText: /@/ })
          .first();
        // If "vi" returns no results in this seed, fall back to any
        // remaining enabled member button (the picker shows the most-
        // recent 50 members on empty/no-match — we just need a SECOND
        // distinct add).
        const fallback = page
          .locator('button:not([disabled])')
          .filter({ has: page.locator('img, [class*="rounded-full"]') })
          .nth(1);

        if ((await nextAddTarget.count()) > 0) {
          await nextAddTarget.click();
        } else {
          await fallback.click();
        }

        // Assert exactly 2 chips now present.
        await expect(
          page.getByRole('button', { name: /^Remove /i })
        ).toHaveCount(2, { timeout: 5_000 });

        // Capture the 2nd chip's remove-name BEFORE clicking the first X
        // so we can verify the right one persists.
        const secondRemoveAria = await page
          .getByRole('button', { name: /^Remove /i })
          .nth(1)
          .getAttribute('aria-label');
        expect(secondRemoveAria).not.toBeNull();
        const secondName = (secondRemoveAria ?? '').replace(/^Remove /i, '');

        // X out the FIRST chip.
        await page.getByRole('button', { name: /^Remove /i }).first().click();

        // Exactly 1 chip remains, and it's the second-added one.
        await expect(
          page.getByRole('button', { name: /^Remove /i })
        ).toHaveCount(1, { timeout: 3_000 });
        await expect(
          page.getByRole('button', { name: new RegExp(`^Remove ${secondName}$`, 'i') })
        ).toHaveCount(1);

        // Reload — server-side state should persist exactly 1 assignee.
        await page.reload();
        await expect(page.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });
        const reloadedRow = page.getByTestId(`row-${itemId}`);
        await expect(reloadedRow).toBeVisible();

        // Re-open the cell to inspect chips post-reload.
        await reloadedRow.getByTestId('cell-person').first().click();
        await expect(
          page.getByPlaceholder(/search by name or email/i)
        ).toBeVisible({ timeout: 5_000 });
        await expect(
          page.getByRole('button', { name: /^Remove /i })
        ).toHaveCount(1, { timeout: 5_000 });
      } finally {
        await deleteItem(page, itemId, accessToken);
      }
    });

    test(`viewer role: cell renders read-only — click does NOT open picker`, async ({
      page,
      request,
    }) => {
      // Pre-step: as admin (via a separate APIRequestContext so the
      // page's storage state stays viewer-clean), seed an item the
      // viewer will look at. The viewer needs a cell to attempt to
      // click on — without a target item this test would just be
      // "viewer sees empty board, can't click anything", which doesn't
      // prove the picker is gated.
      const adminLogin = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: industry.adminEmail,
          password: industry.adminPassword,
        },
      });
      expect(adminLogin.ok()).toBe(true);
      const adminBody = (await adminLogin.json()) as {
        success: boolean;
        data?: { accessToken: string };
      };
      const adminToken = adminBody.data?.accessToken;
      if (!adminToken) throw new Error('admin login (pre-step) returned no token');

      const boardsRes = await request.get(`${API_BASE_URL}/boards`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const boardsBody = (await boardsRes.json()) as {
        data?: { boards?: Array<{ id: number; name: string }> };
      };
      const boardId = (boardsBody.data?.boards ?? []).find(
        (b) => b.name === industry.primaryBoardName
      )?.id;
      if (!boardId) throw new Error(`${industry.slug}: primary board not found`);
      const boardRes = await request.get(`${API_BASE_URL}/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
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
      const personColumn = (board?.columns ?? []).find(
        (c) => c.columnType === 'person'
      );
      const groupId = board?.groups?.[0]?.id;
      test.skip(
        !personColumn || !groupId,
        `${industry.slug}: missing person column or group on primary board`
      );

      const itemName = `Slice21B-D1-viewer-${industry.slug}-${Date.now()}`;
      const createRes = await request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          boardId,
          groupId,
          name: itemName,
          values: {},
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const itemId = created.data?.item?.id;
      if (!itemId) throw new Error('viewer pre-step item create failed');

      // Now log the viewer in on `page` and verify the gate.
      const viewerSession = await loginAsViewer(page, industry);
      test.skip(
        viewerSession === null,
        `${industry.slug}: viewer@${industry.slug}.com login failed — seed may not have run.`
      );

      try {
        await page.goto(`/boards/${boardId}`);
        await expect(page.getByTestId('table-view')).toBeVisible({
          timeout: 10_000,
        });

        const row = page.getByTestId(`row-${itemId}`);
        await expect(row).toBeVisible();
        const personCell = row.getByTestId('cell-person').first();
        await expect(personCell).toBeVisible();

        // Click the cell — viewer-role gate must prevent the picker
        // from mounting. The search input is the picker's signature
        // affordance; if it appears, the gate failed.
        await personCell.click();

        // Brief settle window, then assert the search input is NOT in
        // the DOM. `toHaveCount(0)` with a short timeout fails loudly
        // if any picker dropdown rendered.
        await expect(
          page.getByPlaceholder(/search by name or email/i)
        ).toHaveCount(0, { timeout: 2_000 });
      } finally {
        // Clean up via admin request context — viewer can't DELETE.
        await request.delete(`${API_BASE_URL}/items/${itemId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    });
  });
}
