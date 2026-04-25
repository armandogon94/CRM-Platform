import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 20.5 Phase C — Real-time Socket.io echo across two browser
 * contexts on the SAME industry / SAME board.
 *
 * Closes SPEC §Slice 20 success criterion #5 (the only one that was
 * still unticked after Slice 20A + 20B): "two browser tabs open, any
 * CRUD in tab A reflects in tab B within 2 s (Socket.io echo)."
 *
 * Why two contexts (not two pages): Playwright's browser.newContext()
 * creates an isolated cookie/localStorage namespace, simulating a
 * second user-agent session. We log in as the same admin in BOTH
 * contexts — same workspace, same board, same Socket.io room — so
 * any echo from tab A's mutation must traverse the Socket.io adapter
 * (server-side fan-out) and land in tab B's WS handler.
 *
 * Pre-Slice-20.5 this spec WOULD HAVE failed: industries' BoardPage
 * called local handlers that never emitted WS events. After Slice
 * 20.5 B, every BoardPage consumes useBoard which subscribes to the
 * board room via the shared useWebSocket hook (configured per-industry
 * via configureWebSocket({ tokenKey })). The echo happens
 * automatically in useBoard's onItemCreated/onItemUpdated/
 * onItemDeleted handlers.
 *
 * Test scope: 3 reference industries (NovaPay/MedVista/JurisPath —
 * the canonical Slice 20A coverage matrix). Adding the other 7 would
 * not exercise new code paths since post-Slice-20.5 every industry
 * consumes the same useBoard hook. Defer-to-rotation: rerun across
 * all 10 if a regression surfaces.
 */

interface BoardMeta {
  id: number;
  firstGroupId: number;
  statusColumnId: number | null;
  firstStatusOption: { label: string; color: string } | null;
  secondStatusOption: { label: string; color: string } | null;
}

async function resolvePrimaryBoard(
  page: Parameters<typeof loginAsAdmin>[0],
  industry: IndustryFixture,
  accessToken: string
): Promise<BoardMeta> {
  const listRes = await page.request.get(`${API_BASE_URL}/boards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await listRes.json()) as {
    data?: { boards?: Array<{ id: number; name: string }> };
  };
  const match = (body.data?.boards ?? []).find(
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
          columnType: string;
          config?: { options?: { label: string; color: string }[] };
        }>;
        groups?: Array<{ id: number }>;
      };
    };
  };
  const board = boardBody.data?.board;
  if (!board) throw new Error(`${industry.slug}: GET /boards/${match.id} empty`);
  const statusCol = (board.columns ?? []).find((c) => c.columnType === 'status');
  const opts = statusCol?.config?.options ?? [];
  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) throw new Error(`${industry.slug}: no groups on board`);
  return {
    id: board.id,
    firstGroupId,
    statusColumnId: statusCol?.id ?? null,
    firstStatusOption: opts[0] ?? null,
    secondStatusOption: opts[1] ?? opts[0] ?? null,
  };
}

// Cap the realtime spec to the 3 reference industries (matches the
// Slice 20A E2E coverage decision). Any regression on the other 7
// surfaces via the shared useBoard tests (73/73), not here.
const REALTIME_INDUSTRIES = ['novapay', 'medvista', 'jurispath'];

for (const industry of selectedIndustries().filter((i) =>
  REALTIME_INDUSTRIES.includes(i.slug)
)) {
  test.describe(`Real-time WS echo — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`tab B sees create-item from tab A within 2s`, async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Open tab B as a separate context — fresh storageState, simulates
      // a second user agent.
      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();
      const sessionB = await loginAsAdmin(pageB, industry);
      void sessionB; // tab B has its own token under industry.tokenKey

      // Both tabs land on the same board.
      await page.goto(`/boards/${board.id}`);
      await pageB.goto(`/boards/${board.id}`);

      // Wait for both to finish initial load (table view default).
      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });
      await expect(pageB.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });

      // Mutate via REST in tab A's context (rather than driving the UI)
      // so we isolate the echo path: the question this spec answers is
      // "does the SERVER fan out item:created to tab B's socket?", not
      // "does the UI form work."
      const itemName = `Slice20.5-realtime-${industry.slug}-${Date.now()}`;
      const values: Record<string, unknown> = {};
      if (board.statusColumnId && board.firstStatusOption) {
        values[String(board.statusColumnId)] = {
          label: board.firstStatusOption.label,
          color: board.firstStatusOption.color,
        };
      }
      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values,
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const createdItemId = created.data?.item?.id;

      // Tab B observes the new item via its WS subscription. useBoard's
      // onItemCreated handler appends it to local state; the table row
      // should render within ~1 second of the server emit.
      await expect
        .poll(
          async () => await pageB.getByText(itemName).count(),
          { timeout: 2_000, intervals: [100, 200, 300, 500] }
        )
        .toBeGreaterThan(0);

      // Cleanup.
      if (createdItemId) {
        await page.request.delete(`${API_BASE_URL}/items/${createdItemId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
      await ctxB.close();
    });

    test(`tab B sees update-status from tab A within 2s`, async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Skip if the board has fewer than 2 status options — can't
      // exercise a status change. (Should never happen on the seeded
      // boards but keeps the spec defensive.)
      test.skip(
        !board.statusColumnId ||
          !board.firstStatusOption ||
          !board.secondStatusOption ||
          board.firstStatusOption.label === board.secondStatusOption.label,
        `${industry.slug}: status column lacks 2 distinct options`
      );

      // Seed an item with status option[0]. We'll change it to option[1]
      // and observe the echo in tab B.
      const itemName = `Slice20.5-update-${industry.slug}-${Date.now()}`;
      const initial = board.firstStatusOption!;
      const target = board.secondStatusOption!;

      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values: {
            [String(board.statusColumnId)]: {
              label: initial.label,
              color: initial.color,
            },
          },
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const itemId = created.data!.item!.id;

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

      // Verify both tabs show the initial label first.
      const rowB = pageB.locator('tr', { hasText: itemName });
      await expect(rowB.getByText(initial.label, { exact: true }).first()).toBeVisible();

      // Mutate via REST: change status to target option.
      const updateRes = await page.request.put(
        `${API_BASE_URL}/items/${itemId}/values`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            values: [
              {
                columnId: board.statusColumnId,
                value: { label: target.label, color: target.color },
              },
            ],
          },
        }
      );
      expect(updateRes.ok()).toBe(true);

      // Tab B observes the new label via WS column-value-change echo.
      await expect
        .poll(
          async () =>
            await rowB.getByText(target.label, { exact: true }).count(),
          { timeout: 2_000, intervals: [100, 200, 300, 500] }
        )
        .toBeGreaterThan(0);

      // Cleanup.
      await page.request.delete(`${API_BASE_URL}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await ctxB.close();
    });

    test(`tab B sees delete-item from tab A within 2s`, async ({
      page,
      browser,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Seed a target item.
      const itemName = `Slice20.5-delete-${industry.slug}-${Date.now()}`;
      const values: Record<string, unknown> = {};
      if (board.statusColumnId && board.firstStatusOption) {
        values[String(board.statusColumnId)] = {
          label: board.firstStatusOption.label,
          color: board.firstStatusOption.color,
        };
      }
      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values,
        },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      const itemId = created.data!.item!.id;

      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();
      await loginAsAdmin(pageB, industry);

      await page.goto(`/boards/${board.id}`);
      await pageB.goto(`/boards/${board.id}`);

      // Both see the item.
      await expect(pageB.getByText(itemName)).toBeVisible({ timeout: 10_000 });

      // Delete via REST in tab A's context.
      const delRes = await page.request.delete(
        `${API_BASE_URL}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      expect(delRes.ok()).toBe(true);

      // Tab B observes the removal via WS item:deleted echo.
      await expect
        .poll(async () => await pageB.getByText(itemName).count(), {
          timeout: 2_000,
          intervals: [100, 200, 300, 500],
        })
        .toBe(0);

      await ctxB.close();
    });
  });
}
