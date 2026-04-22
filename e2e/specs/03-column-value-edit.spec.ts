import { test, expect } from '../fixtures/test';
import { websocketClient } from '../helpers/websocket';

/**
 * Slice 19 — Flow 3: Edit a Status cell and prove the change propagates.
 *
 * What this spec asserts:
 *   1. The primary (acting) client can click a Status cell, pick a new
 *      option from the picker, and see the cell reflect the new value.
 *   2. Reloading the page proves the value was persisted (not just React
 *      state) — the row round-trips through PATCH /column-values and is
 *      rehydrated from GET /boards/:id/items.
 *   3. A second pre-authenticated browser context subscribed to the same
 *      board receives the `column_value:changed` Socket.io event with a
 *      payload that matches the mutation (correct itemId, columnId,
 *      new status label).
 *
 * Data contract — Slice 19 B1 + B2:
 *   The fixture workspace contains a "Transaction Pipeline" board with a
 *   Status column whose seeded options are
 *     New (default) • In Progress • Flagged • Resolved.
 *   The board ships with no group and no items — B1/B2 only create the
 *   structural minimum needed by the Flow 5 automation. So each test
 *   provisions its own BoardGroup (once per board) and its own Item via
 *   the public REST API before the interaction, and tears that item down
 *   in afterEach so repeated runs never accumulate orphan rows.
 *
 * Status option choice — "In Progress":
 *   Picking `Flagged` would trigger the Flow 5 automation
 *   (seedNovaPayE2eFlaggedAutomation) which posts a notification as a
 *   side effect. Flow 3 is about raw column-value propagation; side
 *   effects belong to Flow 5. "In Progress" has no automation attached.
 *
 * WS event contract — `backend/src/services/ColumnValueService.ts`:
 *   ColumnValueService.upsert() calls
 *     wsService.emitToBoard(boardId, 'column_value:changed', {
 *       itemId, columnId, value, columnValue
 *     })
 *   after every cell update. The helper in C5 (`websocketClient`) taps
 *   the second context's websocket frames and exposes the typed events
 *   through `waitForEvent(type, { timeoutMs })`.
 *
 * Selector discipline (SPEC §Slice 19):
 *   - Role-based queries only (getByRole / getByLabel).
 *   - No CSS / XPath, no `page.waitForTimeout`.
 *   - For the Status cell and option list we scope through the item's
 *     table row so the same markup on other rows (other items that
 *     future seeds may add) cannot collide with this test's state.
 */

type TokenResponse = {
  success?: boolean;
  data?: { accessToken?: string; user?: { workspaceId?: number } };
};

type BoardListResponse = {
  success?: boolean;
  data?: {
    boards?: Array<{
      id: number;
      name: string;
      workspaceId: number;
    }>;
  };
};

type GroupListResponse = {
  success?: boolean;
  data?: Array<{ id: number; name: string }>;
};

type CreateGroupResponse = {
  success?: boolean;
  data?: { id: number };
};

type CreateItemResponse = {
  success?: boolean;
  data?: { item?: { id: number } };
};

interface FixtureContext {
  token: string;
  workspaceId: number;
  boardId: number;
  groupId: number;
  itemId: number;
  itemName: string;
}

/**
 * Reads the NovaPay auth token persisted by `auth.setup.ts` out of the
 * page's localStorage. A dedicated helper keeps the localStorage key
 * (`novapay_token`, set by frontends/novapay/src/utils/api.ts) in one
 * place so any rename on the frontend side only needs a one-line fix.
 */
async function readAuthToken(page: import('@playwright/test').Page): Promise<string> {
  // `page.evaluate` runs in the browser realm, so `localStorage` is the
  // `Window` instance of the NovaPay app. The outer tsconfig does not
  // include the DOM lib, so we reach through `globalThis` instead of
  // referencing `window` to keep tsc happy without pulling in the DOM.
  const token = await page.evaluate<string | null>(
    () =>
      (globalThis as unknown as { localStorage: { getItem(key: string): string | null } })
        .localStorage.getItem('novapay_token')
  );
  expect(token, 'e2e user auth token must be present in localStorage').toBeTruthy();
  return token as string;
}

test.describe('Flow 3 — edit a column value and observe WS propagation', () => {
  let fixture: FixtureContext;

  test.beforeEach(async ({ page, request, baseURL }) => {
    // Land on /boards so the storageState-hydrated session has a chance
    // to deposit the auth token into localStorage on the app's origin.
    await page.goto('/');
    await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });

    const token = await readAuthToken(page);
    const apiBase = `${baseURL}/api/v1`;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Resolve fixture board: pick the e2e user's own workspace boards
    // (the JWT is stamped with workspaceId = fixture workspace, so the
    // un-parameterised /boards endpoint already returns only those).
    const boardsRes = await request.get(`${apiBase}/boards`, { headers: authHeaders });
    expect(boardsRes.ok(), 'GET /boards should succeed for the e2e user').toBeTruthy();
    const boardsBody = (await boardsRes.json()) as BoardListResponse;
    const pipeline = boardsBody.data?.boards?.find(
      (b) => b.name === 'Transaction Pipeline'
    );
    expect(pipeline, 'fixture Transaction Pipeline board must exist (Slice 19 B1/B2)')
      .toBeDefined();

    const workspaceId = pipeline!.workspaceId;
    const boardId = pipeline!.id;

    // B1/B2 never create a BoardGroup — provision one if none exists.
    // findOrCreate semantics via a GET-then-POST keeps the seed path
    // free of drift and survives parallel workers because the Board+
    // BoardGroup unique index is (boardId, name).
    const groupsRes = await request.get(
      `${apiBase}/workspaces/${workspaceId}/boards/${boardId}/groups`,
      { headers: authHeaders }
    );
    expect(groupsRes.ok(), 'GET /groups should succeed').toBeTruthy();
    const groupsBody = (await groupsRes.json()) as GroupListResponse;
    let groupId = groupsBody.data?.[0]?.id;

    if (!groupId) {
      const createGroupRes = await request.post(
        `${apiBase}/workspaces/${workspaceId}/boards/${boardId}/groups`,
        {
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          data: { name: 'E2E Items', color: '#9CA3AF', position: 0 },
        }
      );
      expect(createGroupRes.ok(), 'POST /groups should succeed').toBeTruthy();
      const created = (await createGroupRes.json()) as CreateGroupResponse;
      groupId = created.data?.id;
      expect(groupId, 'created group must expose numeric id').toBeTruthy();
    }

    // Provision a dedicated item for THIS test. Unique timestamp-suffixed
    // name avoids collisions if the afterEach cleanup ever misses a row
    // (e.g. the test process is killed mid-run) — the orphan is visible,
    // not a silent contamination of a future run.
    const itemName = `Flow 3 E2E — ${Date.now()}`;
    const createItemRes = await request.post(`${apiBase}/items`, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      data: { boardId, groupId, name: itemName },
    });
    expect(createItemRes.ok(), 'POST /items should succeed').toBeTruthy();
    const createdItem = (await createItemRes.json()) as CreateItemResponse;
    const itemId = createdItem.data?.item?.id;
    expect(itemId, 'created item must expose numeric id').toBeTruthy();

    fixture = {
      token,
      workspaceId,
      boardId,
      groupId: groupId as number,
      itemId: itemId as number,
      itemName,
    };
  });

  test.afterEach(async ({ request, baseURL }) => {
    if (!fixture) return;
    const apiBase = `${baseURL}/api/v1`;
    // Best-effort delete; if the route 404s because the test already
    // deleted its own row, that is not a failure of the cleanup step.
    await request
      .delete(
        `${apiBase}/workspaces/${fixture.workspaceId}/boards/${fixture.boardId}/items/${fixture.itemId}`,
        { headers: { Authorization: `Bearer ${fixture.token}` } }
      )
      .catch(() => {
        /* cleanup is best-effort */
      });
  });

  test('changes a status cell, persists across reload, and propagates via WebSocket', async ({
    page,
    browser,
    a11yScan,
  }) => {
    // Open a second subscribed context BEFORE the mutation so the
    // socket.io join-room handshake has time to complete and is ready
    // to receive the frame we are about to cause.
    const client = await websocketClient(browser, `/boards/${fixture.boardId}`);

    try {
      // Navigate the primary context to the same board and wait for the
      // board heading — asserting against a role query proves React
      // finished rendering the BoardPage (not still on a loading
      // spinner).
      await page.goto(`/boards/${fixture.boardId}`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
      ).toBeVisible();

      // Scope through the item's row so cells named "New" from future
      // seed data (or from the Flagged automation creating notifications
      // that render "New" elsewhere on the page) cannot match.
      const itemRow = page.getByRole('row', { name: new RegExp(fixture.itemName) });
      await expect(itemRow).toBeVisible();

      // A11y audit — BoardPage in Table view with the provisioned item
      // visible. Running before the cell-edit flow means the scan sees
      // the resting TableView DOM, not a transient ColumnEditor popover
      // or a post-reload intermediate state. Slice 19 E2.
      await a11yScan();

      // Status cell starts at the column-config default_option ("New" —
      // seeded in backend/src/seeds/novapay/automations.ts). Clicking
      // it swaps the <td> content from ColumnRenderer (StatusBadge) to
      // ColumnEditor (a flyout of <button> options).
      const statusCellInitial = itemRow.getByRole('cell', { name: /^New$/ });
      await expect(statusCellInitial).toBeVisible();
      await statusCellInitial.click();

      // ColumnEditor's status variant renders each option as a <button>
      // with its label as the accessible name — pick "In Progress" so
      // this spec does not cross-trigger the Flagged→notification
      // automation owned by Flow 5.
      const inProgressOption = page.getByRole('button', { name: 'In Progress' });
      await expect(inProgressOption).toBeVisible();
      await inProgressOption.click();

      // After selection the ColumnEditor calls onBlur (see
      // frontends/_shared/src/components/board/ColumnEditor.tsx status
      // branch) which collapses the cell back to display mode with the
      // new StatusBadge.
      await expect(itemRow.getByRole('cell', { name: /^In Progress$/ })).toBeVisible();

      // Persistence proof: reload drops all React state and re-fetches
      // /boards/:id/items from the server. If the new value only ever
      // lived in component state, this assertion fails.
      await page.reload();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
      ).toBeVisible();
      const reloadedRow = page.getByRole('row', { name: new RegExp(fixture.itemName) });
      await expect(reloadedRow.getByRole('cell', { name: /^In Progress$/ })).toBeVisible();

      // Real-time propagation proof: the second context must have
      // observed a `column_value:changed` frame whose payload refers to
      // this test's item + column and whose value carries the
      // "In Progress" label. The `match` predicate avoids a false
      // positive if some unrelated cell on the same board ever emits
      // the same event in parallel (e.g. batch seeds).
      const received = await client.waitForEvent('column_value:changed', {
        timeoutMs: 2_000,
        match: (event) => {
          const payload = event.payload as {
            itemId?: number;
            value?: { label?: string };
          } | undefined;
          return (
            payload?.itemId === fixture.itemId &&
            payload?.value?.label === 'In Progress'
          );
        },
      });

      // Final shape check so a regression that drops fields from the
      // payload (e.g. removing `columnId`) surfaces here rather than as
      // a silent client-side bug later.
      const payload = received.payload as {
        itemId: number;
        columnId: number;
        value: { label: string };
      };
      expect(payload.itemId).toBe(fixture.itemId);
      expect(typeof payload.columnId).toBe('number');
      expect(payload.value.label).toBe('In Progress');
    } finally {
      await client.dispose();
    }
  });
});
