import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';
import { deleteItem, loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 20 Flow C — Inline-edit a Status cell on Table view.
 *
 * SPEC §Slice 20 Flow C:
 *   Clicking a Status cell mounts ColumnEditor in-place. Selecting a
 *   new option fires PUT /items/:id/values with { label, color }
 *   shape. The UI updates optimistically in useBoard (Slice 20 A3) —
 *   or in the industry BoardPage's local optimistic handler for
 *   NovaPay/MedVista/JurisPath which bypass useBoard. Either way
 *   the cell renders the new label + color immediately; on reload
 *   the change must persist.
 *
 * Determinism:
 *   - beforeEach creates a fresh item via REST so the edit target
 *     is deterministic across industries (their seeded status options
 *     differ: NovaPay has Pending/Processing/Settled, MedVista has
 *     New/Intake/Active/Discharged, JurisPath has Intake/Discovery/...).
 *   - We read the item's initial Status value from the POST response,
 *     then pick any *other* option to assert a real change.
 *   - afterEach deletes the item via REST (flat DELETE /items/:id
 *     shim from A2.5).
 *
 * This spec intentionally accepts any status option that is NOT the
 * item's current value — it doesn't hard-code option names so the
 * same spec works across all 3 industries without branching.
 */

interface BoardMeta {
  id: number;
  statusColumn: { id: number; options: { label: string; color: string }[] };
  firstGroupId: number;
}

async function resolvePrimaryBoard(
  page: Parameters<typeof loginAsAdmin>[0],
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
  const body = (await listRes.json()) as {
    success: boolean;
    data?: { boards?: Array<{ id: number; name: string }> };
  };
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
  if (!statusCol)
    throw new Error(`${industry.slug}: no status column on "${match.name}"`);
  const options = statusCol.config?.options ?? [];
  if (options.length < 2) {
    throw new Error(
      `${industry.slug}: status column has < 2 options — can't exercise a change`
    );
  }
  const firstGroupId = board.groups?.[0]?.id;
  if (!firstGroupId) throw new Error(`${industry.slug}: no groups on board`);
  return {
    id: board.id,
    statusColumn: { id: statusCol.id, options },
    firstGroupId,
  };
}

for (const industry of selectedIndustries()) {
  test.describe(`Flow C (inline-edit Status) — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    let accessToken: string | null = null;
    let createdItemId: number | null = null;

    test.afterEach(async ({ page }) => {
      if (createdItemId && accessToken) {
        try {
          await deleteItem(page, createdItemId, accessToken);
        } catch {
          // best-effort
        }
      }
      createdItemId = null;
      accessToken = null;
    });

    test(`edits a Status cell inline and the change persists across reload`, async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      accessToken = session.accessToken;
      const board = await resolvePrimaryBoard(page, industry, accessToken);

      // Create a deterministic target item with the first status option
      // seeded as its initial value — we'll change it to the second.
      const initial = board.statusColumn.options[0];
      const target = board.statusColumn.options[1];
      const itemName = `Slice20-C-${industry.slug}-${Date.now()}`;

      const createRes = await page.request.post(`${API_BASE_URL}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          boardId: board.id,
          groupId: board.firstGroupId,
          name: itemName,
          values: {
            [board.statusColumn.id]: { label: initial.label, color: initial.color },
          },
        },
      });
      expect(createRes.ok(), `item create should succeed`).toBe(true);
      const createBody = (await createRes.json()) as {
        data?: { item?: { id: number } };
      };
      createdItemId = createBody.data?.item?.id ?? null;
      expect(createdItemId).not.toBeNull();

      // Navigate to the board (Table view is default in the new BoardPage).
      await page.goto(`/boards/${board.id}`);
      await expect(
        page.getByRole('heading', { level: 1, name: industry.primaryBoardName })
      ).toBeVisible({ timeout: 10_000 });

      const tableToggle = page.getByRole('button', { name: /^Table$/ });
      if ((await tableToggle.count()) > 0) {
        await tableToggle.first().click();
      }
      await expect(page.getByTestId('table-view')).toBeVisible({
        timeout: 10_000,
      });

      // Find the row for our item by its unique name, then locate its
      // Status cell within that row. Row 0 col 0 is the item-name cell;
      // the Status column position varies per industry — but every seeded
      // board puts a Status-typed column in the top 3, and ColumnRenderer
      // badges the value as a StatusBadge so the initial label is
      // searchable by role/name.
      const itemRow = page.locator('tr', { hasText: itemName });
      await expect(itemRow).toBeVisible({ timeout: 5_000 });

      const statusBadge = itemRow
        .getByText(initial.label, { exact: true })
        .first();
      await expect(statusBadge).toBeVisible();
      await statusBadge.click();

      // ColumnEditor renders the options list — click the target one.
      const targetOption = page
        .getByRole('button', { name: target.label, exact: true })
        .first();
      await expect(targetOption).toBeVisible({ timeout: 3_000 });
      await targetOption.click();

      // Optimistic update surfaces the new label on the row.
      await expect(
        itemRow.getByText(target.label, { exact: true }).first()
      ).toBeVisible({ timeout: 3_000 });

      // Reload and confirm persistence.
      await page.reload();
      const reloadedRow = page.locator('tr', { hasText: itemName });
      await expect(
        reloadedRow.getByText(target.label, { exact: true }).first()
      ).toBeVisible({ timeout: 10_000 });
    });
  });
}
