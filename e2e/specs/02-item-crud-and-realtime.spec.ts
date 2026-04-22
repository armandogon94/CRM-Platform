import { test, expect } from '../fixtures/test';
import { websocketClient } from '../helpers/websocket';

/**
 * Slice 19 — Flow 2: Item CRUD + WebSocket realtime.
 *
 * SPEC §Slice 19 flow 2:
 *   Create item "E2E Test Deal" → appears in Table view → a second
 *   browser context subscribed to the same board receives the
 *   `item:created` WebSocket event and renders the new row within 2s.
 *
 * The primary context starts pre-authenticated via the `setup` project
 * (Slice 19 C4). A second pre-authenticated context is opened through
 * `websocketClient()` (Slice 19 C5) to verify the server's Socket.io
 * broadcast — `ItemService.create()` emits `item:created` to the board
 * room *after* transaction commit (see backend/src/services/ItemService.ts
 * line 282 and backend/src/services/WebSocketService.ts `emitToBoard`).
 *
 * Selector discipline per SPEC §Slice 19:
 *   getByRole → getByLabel → getByTestId; no raw CSS / XPath.
 *   No page.waitForTimeout — auto-waits and `waitForEvent` only.
 *
 * Item-creation UI path (as of Slice 19 D2): the header "New Item"
 * button in `frontends/_shared/src/pages/BoardPage.tsx` (line ~201) is
 * decorative — no onClick handler is wired. The actual working flow is
 * the inline "+ Add item" input rendered inside `TableView` (see
 * `frontends/_shared/src/components/board/TableView.tsx` line ~196),
 * which calls `onItemCreate(group.id, name)`. The spec drives that
 * inline input; when BoardPage wires the modal/onItemCreate prop, this
 * spec continues to work because the inline input remains the
 * canonical creation affordance.
 *
 * Cleanup: created items are deleted via the REST API in
 * `test.afterEach`, and the WS second context is disposed — prevents
 * the fixture workspace from accumulating rows across runs between
 * `globalSetup.ts` resets (Slice 19 C3).
 */

const ITEM_NAME = 'E2E Test Deal';
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? 'http://localhost:13000/api/v1';
const TOKEN_KEY = 'crm_access_token';

// Shape of the `item:created` WS payload — `ItemService.getById()`
// returns the full item including id/name (see ItemService.ts L281-282).
interface CreatedItemPayload {
  id: number;
  name: string;
  boardId: number;
  groupId?: number;
  workspaceId?: number;
}

function isCreatedItemPayload(payload: unknown): payload is CreatedItemPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as { id?: unknown }).id === 'number' &&
    typeof (payload as { name?: unknown }).name === 'string'
  );
}

test.describe('Flow 2 — item CRUD and realtime propagation', () => {
  // Track items to clean up so an unexpected spec failure doesn't leak
  // rows into subsequent runs (globalSetup resets once per suite, not
  // per spec). Populated as soon as the WS event arrives.
  let createdItemId: number | null = null;
  let workspaceId: number | null = null;
  let boardId: number | null = null;
  let accessToken: string | null = null;

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup — never fail the test on cleanup errors,
    // but surface them via console for debugging.
    if (createdItemId && workspaceId && boardId && accessToken) {
      try {
        await page.request.delete(
          `${API_BASE_URL}/workspaces/${workspaceId}/boards/${boardId}/items/${createdItemId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Flow 2 cleanup: failed to delete item', err);
      }
    }
    createdItemId = null;
    workspaceId = null;
    boardId = null;
    accessToken = null;
  });

  test('primary context creates item; secondary context receives item:created WS event and renders it', async ({
    page,
    browser,
  }) => {
    // --- 1. Navigate to the Transaction Pipeline board (same pattern as D1). ---
    await page.goto('/');
    await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { level: 1, name: 'Boards' })
    ).toBeVisible();

    const pipelineCard = page.getByRole('button', {
      name: /Transaction Pipeline/,
    });
    await expect(pipelineCard).toBeVisible();
    await pipelineCard.click();

    // Wait for the board route AND the board page to mount. The numeric
    // id in the URL is the boardId we'll reuse for cleanup + WS room.
    await page.waitForURL(/\/boards\/\d+(?:\/|$|\?)/, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
    ).toBeVisible();

    const boardPath = new URL(page.url()).pathname;
    const boardIdMatch = boardPath.match(/\/boards\/(\d+)/);
    expect(
      boardIdMatch,
      'expected URL to contain /boards/<numeric-id>'
    ).not.toBeNull();
    boardId = Number(boardIdMatch![1]);

    // --- 2. Capture auth + workspace from the primary context for cleanup. ---
    // Token is stashed in localStorage by AuthContext (`crm_access_token`);
    // workspace id is reachable via a single /auth/me call from the
    // browser — avoids duplicating login logic here.
    accessToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      TOKEN_KEY
    );
    expect(accessToken, 'expected access token in localStorage').toBeTruthy();

    const meRes = await page.request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.ok(), '/auth/me should succeed').toBe(true);
    const meBody = (await meRes.json()) as {
      data?: { user?: { workspaceId?: number }; workspaceId?: number };
    };
    const ws =
      meBody.data?.user?.workspaceId ?? meBody.data?.workspaceId ?? null;
    expect(ws, 'expected workspaceId on /auth/me response').toBeTruthy();
    workspaceId = ws!;

    // --- 3. Open the second context BEFORE creating the item. ---
    // Opening early ensures the subscriber is already in the board room
    // when the server broadcasts, so we can't miss the event due to a
    // race between context startup and the POST /items response.
    const wsClient = await websocketClient(browser, boardPath);
    try {
      // Wait for the second context's board UI to settle so its
      // socket.io-client has joined the `board:<id>` room; the header
      // mounting is a reliable proxy (same selector as primary).
      await expect(
        wsClient.page.getByRole('heading', {
          level: 1,
          name: 'Transaction Pipeline',
        })
      ).toBeVisible({ timeout: 10_000 });

      // --- 4. Create the item via the real UI (inline "+ Add item"). ---
      // The inline input lives inside TableView (first group section,
      // rendered by default since the Table view is the default tab on
      // BoardPage.tsx). `data-testid="inline-add-item-input"` was added
      // in this task specifically so the spec doesn't rely on a shared
      // placeholder string that could match multiple inputs once other
      // group sections render.
      const addItemInput = page
        .getByTestId('inline-add-item-input')
        .first();
      await expect(addItemInput).toBeVisible({ timeout: 5_000 });

      await addItemInput.fill(ITEM_NAME);

      // Submit by pressing Enter (matches TableView's onKeyDown
      // handler). Wait for the POST /items response so we know the
      // backend completed — this also gives us the created item id as
      // a belt-and-suspenders cleanup path if the WS event is missed.
      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes(`/boards/${boardId}/items`) &&
            res.request().method() === 'POST',
          { timeout: 10_000 }
        ),
        addItemInput.press('Enter'),
      ]);
      expect(createResponse.ok(), 'POST /items should return 2xx').toBe(true);
      const createBody = (await createResponse.json()) as {
        data?: { id?: number; item?: { id?: number } };
      };
      const createdId =
        createBody.data?.id ?? createBody.data?.item?.id ?? null;
      expect(createdId, 'created item should have an id').toBeTruthy();
      createdItemId = createdId!;

      // --- 5. Assert the item row appears in the primary context's Table view. ---
      // `<tr>` rows include their cell text as the accessible name, so
      // getByRole('row') with a name regex is the deterministic match
      // (independent of any ordering within the group).
      await expect(
        page.getByRole('row', { name: new RegExp(ITEM_NAME) })
      ).toBeVisible({ timeout: 5_000 });

      // --- 6. Assert the second context received the WS event under 2s. ---
      const event = await wsClient.waitForEvent('item:created', {
        timeoutMs: 2_000,
        match: (e) =>
          isCreatedItemPayload(e.payload) &&
          (e.payload as CreatedItemPayload).id === createdItemId,
      });
      expect(event.type).toBe('item:created');
      expect(isCreatedItemPayload(event.payload)).toBe(true);
      const payload = event.payload as CreatedItemPayload;
      expect(payload.id).toBe(createdItemId);
      expect(payload.name).toBe(ITEM_NAME);

      // --- 7. Assert the second context's Table view also renders the new item. ---
      // The frontend's useBoard hook wires `onItemCreated` into React
      // state (see frontends/_shared/src/hooks/useBoard.ts `onItemCreated`
      // → `addItem`), so the row should appear in the DOM on its own.
      // Use the same role-based matcher as the primary context.
      await expect(
        wsClient.page.getByRole('row', { name: new RegExp(ITEM_NAME) })
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      // Always tear down the second context — otherwise Chromium leaks
      // across workers and subsequent tests will see cross-context WS
      // frames bleed into their captures.
      await wsClient.dispose();
    }
  });
});
