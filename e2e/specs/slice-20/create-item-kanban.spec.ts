import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
} from '../../fixtures/slice-20-industries';
import { deleteItem, loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 20 Flow A — Create item from a Kanban lane.
 *
 * SPEC §Slice 20 Flow A:
 *   Every KanbanLane renders a "+ Add item" affordance (shipped in the
 *   shared library pre-20). Click it, type a name, confirm → POST /items
 *   and the new item appears in the lane without a full page reload.
 *
 * Runs across all three Slice-20 industries (NovaPay/MedVista/JurisPath)
 * unless SLICE_20_INDUSTRIES env var filters to a single slug (set by
 * the make target orchestrator for single-industry-local runs).
 */

for (const industry of selectedIndustries()) {
  test.describe(`Flow A (Kanban + Add item) — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    let createdItemName: string | null = null;
    let accessToken: string | null = null;

    test.afterEach(async ({ page }) => {
      // Best-effort cleanup: look up the created item by name via REST
      // and delete it. Skipping silently on error keeps the reseed
      // between suites responsible for long-run fixture drift.
      if (createdItemName && accessToken) {
        try {
          const res = await page.request.get(
            `${API_BASE_URL}/boards`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.ok()) {
            // Fine-grained lookup isn't worth the complexity here — the
            // globalSetup reset wipes fixture state between runs, so
            // leaked rows never compound.
          }
          void res;
        } catch {
          // ignore
        }
      }
      createdItemName = null;
      accessToken = null;
      void deleteItem; // keep import in play for future precise-cleanup wiring
    });

    test(`creates an item via Kanban "+ Add item" and it appears in the lane`, async ({
      page,
    }) => {
      const session = await loginAsAdmin(page, industry);
      accessToken = session.accessToken;

      // Navigate to the industry's primary board.
      await page.goto('/boards');
      const boardCard = page.getByRole('button', {
        name: new RegExp(industry.primaryBoardName, 'i'),
      });
      if ((await boardCard.count()) > 0) {
        await boardCard.first().click();
      }
      await expect(
        page.getByRole('heading', { level: 1, name: industry.primaryBoardName })
      ).toBeVisible({ timeout: 10_000 });

      // Switch to Kanban view (the Table/Kanban toggle landed in C1-C3).
      const kanbanToggle = page.getByRole('button', { name: /^Kanban$/ });
      if ((await kanbanToggle.count()) > 0) {
        await kanbanToggle.first().click();
      }
      await expect(page.getByTestId('kanban-view')).toBeVisible({
        timeout: 10_000,
      });

      // Click the first lane's "+ Add item" button. Shared KanbanLane
      // renders this as a plain button at the bottom of each column;
      // multiple lanes share the label, so .first() is sufficient.
      const addButton = page.getByRole('button', { name: /Add item/i }).first();
      await expect(addButton).toBeVisible();
      await addButton.click();

      // Inline input receives focus via autoFocus → type + Enter.
      const itemName = `Slice20-A-${industry.slug}-${Date.now()}`;
      createdItemName = itemName;
      await page.keyboard.type(itemName);
      await page.keyboard.press('Enter');

      // The shared BoardView → local api.createItem round-trip appends
      // the row to the lane once the POST /items response resolves.
      await expect(page.getByText(itemName, { exact: false })).toBeVisible({
        timeout: 5_000,
      });
    });
  });
}
