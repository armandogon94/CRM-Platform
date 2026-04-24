import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 20 Flow D — Delete an item from a Kanban card.
 *
 * SPEC §Slice 20 Flow D + B1:
 *   Each Kanban card renders a kebab menu (aria-label="Item actions",
 *   shared KanbanCard). Clicking it opens a role="menu" dropdown with
 *   a Delete option. Delete opens ConfirmDialog (role="dialog",
 *   aria-labelledby → title). Confirming fires onItemDelete(itemId).
 *
 * Spec drives the full affordance chain, then reloads to verify the
 * item stays gone (soft-deleted server-side via flat DELETE /items/:id
 * — A2.5 shim).
 *
 * Determinism: creates a dedicated item via REST in beforeEach with a
 * timestamped unique name so the delete target is never ambiguous
 * even when parallel workers race on the same board.
 */

interface BoardMeta {
  id: number;
  firstGroupId: number;
  statusColumnId: number | null;
  firstStatusOption: { label: string; color: string } | null;
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
  const firstOption = statusCol?.config?.options?.[0] ?? null;
  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) throw new Error(`${industry.slug}: no groups on board`);
  return {
    id: board.id,
    firstGroupId,
    statusColumnId: statusCol?.id ?? null,
    firstStatusOption: firstOption,
  };
}

for (const industry of selectedIndustries()) {
  test.describe(`Flow D (delete item from Kanban card) — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`opens kebab, confirms delete, card disappears and stays gone after reload`, async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      const accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Seed a deterministic target with the first status option so
      // the Kanban view definitely buckets it into a visible lane
      // (every industry's lanes are keyed on Status options).
      const itemName = `Slice20-D-${industry.slug}-${Date.now()}`;
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

      // Navigate + switch to Kanban view.
      await page.goto(`/boards/${board.id}`);
      await expect(
        page.getByRole('heading', { level: 1, name: industry.primaryBoardName })
      ).toBeVisible({ timeout: 10_000 });
      const kanbanToggle = page.getByRole('button', { name: /^Kanban$/ });
      if ((await kanbanToggle.count()) > 0) {
        await kanbanToggle.first().click();
      }
      await expect(page.getByTestId('kanban-view')).toBeVisible({
        timeout: 10_000,
      });

      // Locate the card bearing our item name. Multiple children within
      // the card share the name string, so scope via the containing
      // card element (`.relative` is the KanbanCard root class — more
      // stable: search for the full text then navigate up).
      const card = page
        .locator('div', { hasText: itemName })
        .filter({ has: page.getByRole('button', { name: /item actions/i }) })
        .first();
      await expect(card).toBeVisible({ timeout: 5_000 });

      // Click the kebab scoped to this card.
      await card.getByRole('button', { name: /item actions/i }).click();

      // Click the Delete menuitem — shared KanbanCard renders
      // role="menuitem".
      await page.getByRole('menuitem', { name: /delete/i }).click();

      // ConfirmDialog renders role="dialog" with the item name in the
      // title ("Delete {item.name}?").
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(itemName);

      // Confirm button in the dialog — the label is literally "Delete"
      // (ConfirmDialog variant='danger').
      await dialog.getByRole('button', { name: /^delete$/i }).click();

      // Card gone from DOM immediately (optimistic remove in BoardPage
      // handlers — C1/C2/C3).
      await expect(page.getByText(itemName, { exact: false })).toHaveCount(0, {
        timeout: 5_000,
      });

      // Reload — item remains deleted server-side (A2.5 paranoid soft
      // delete persists past the refresh).
      await page.reload();
      await expect(page.getByTestId('kanban-view')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(itemName, { exact: false })).toHaveCount(0);
    });
  });
}
