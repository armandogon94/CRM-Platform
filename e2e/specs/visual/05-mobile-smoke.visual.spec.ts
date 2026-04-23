import { test, expect } from '@playwright/test';
import { prepareForSnapshot } from '../../helpers/visual';

/**
 * Mobile visual smoke (Slice 19B E1).
 *
 * Most mobile coverage already lands via D1 (login × 10 industries) and
 * D3 (8 board views × NovaPay) running under the `visual-mobile`
 * Playwright project. The unique value here is snapshotting the
 * **column-edit Status picker** — an interactive modal that none of
 * the static-state specs exercise and which can render differently on
 * a 430×932 viewport (iPhone 14 Pro) due to tap-target sizing + bottom-
 * sheet-style modal layout in the shared StatusBadge picker.
 *
 * Desktop is skipped — desktop coverage of the same interaction is
 * implicit in D3's TableView snapshot and adding it here would just
 * duplicate baselines.
 */

test.describe('mobile smoke — NovaPay column-edit picker', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'visual-mobile',
      'E1 is mobile-only — desktop is covered by D3 TableView.'
    );
  });

  test('Status picker opens over TableView cell on iPhone viewport', async ({ page }) => {
    // Land on the authenticated home page; NovaPay renders state-based
    // navigation, so the board list appears post-auth at `/`.
    await page.goto('/');

    // Tap "Transaction Pipeline" to open the seeded fixture board. The
    // visible-first match avoids any collision with a sidebar duplicate.
    await page.getByText('Transaction Pipeline').first().click();

    // Wait for the Table view to mount — data-testid added in Slice 19 D4.
    await page.getByTestId('table-view').waitFor({ timeout: 10_000 });

    // Open the first row's Status cell picker. StatusBadge renders a
    // button with the status label as accessible name; tapping it
    // surfaces the picker modal. The role+name query is robust across
    // industry themes (the label text depends on seed data; we match
    // any of the seeded fixture statuses).
    const statusButton = page
      .getByRole('button', { name: /^(New|In Progress|Flagged|Resolved)$/ })
      .first();
    await statusButton.waitFor({ timeout: 5_000 });
    await statusButton.tap();

    // Wait for the picker's option list to render. We reuse the same
    // label vocabulary but look for the options specifically.
    await page
      .getByRole('option', { name: /In Progress/ })
      .or(page.getByRole('menuitem', { name: /In Progress/ }))
      .or(page.getByRole('button', { name: /^In Progress$/ }).nth(1))
      .waitFor({ timeout: 5_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('column-edit-picker-novapay.png', { mask });
  });
});
