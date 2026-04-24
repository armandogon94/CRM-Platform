import { test, expect } from '../../fixtures/test';
import { selectedIndustries } from '../../fixtures/slice-20-industries';
import { loginAsAdmin } from '../../helpers/slice-20-login';

/**
 * Slice 20 Flow B — Create item from Table group.
 *
 * SPEC §Slice 20 Flow B:
 *   The shared TableView renders a "+ Add item" inline input per group
 *   header. Click it, type a name, confirm → POST /items via the
 *   industry's BoardPage onItemCreate callback → row appears.
 *
 * Note: the spec intentionally stays at the "inline group-add" level
 * rather than opening the full FormView modal. Slice 20 B2 promised
 * FormView integration as a modal but the shared BoardView currently
 * only surfaces FormView when the selected `viewType === 'form'` —
 * and none of the 3 industries expose a Form toggle in C1-C3. Inline
 * Table group add is the canonical create affordance we ship in this
 * slice; FormView-modal is a Slice 21+ polish.
 *
 * Cleanup deferred to the reseed between suite runs (globalSetup.ts).
 */

for (const industry of selectedIndustries()) {
  test.describe(`Flow B (Table group + Add item) — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`creates an item via Table group "+ Add item" and row appears`, async ({
      page,
    }) => {
      await loginAsAdmin(page, industry);

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

      // Ensure Table view is active (it's the default in BoardPage but
      // user may have toggled elsewhere in a cached session).
      const tableToggle = page.getByRole('button', { name: /^Table$/ });
      if ((await tableToggle.count()) > 0) {
        await tableToggle.first().click();
      }

      // Click the first group's "+ Add item" button. The shared TableView
      // renders one per group header.
      const addButton = page.getByRole('button', { name: /Add item/i }).first();
      await expect(addButton).toBeVisible({ timeout: 10_000 });
      await addButton.click();

      // Inline input carries data-testid="inline-add-item-input" per
      // TableView.tsx line 205 — stable across shared-library renames.
      const input = page.getByTestId('inline-add-item-input');
      await expect(input).toBeFocused();

      const itemName = `Slice20-B-${industry.slug}-${Date.now()}`;
      await input.fill(itemName);
      await page.keyboard.press('Enter');

      // Row appears in the table after the POST /items echo.
      await expect(page.getByText(itemName, { exact: false })).toBeVisible({
        timeout: 5_000,
      });
    });
  });
}
