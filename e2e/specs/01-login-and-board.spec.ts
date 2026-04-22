import { test, expect } from '../fixtures/test';

/**
 * Slice 19 — Flow 1: Login → BoardListPage → open seeded board.
 *
 * Starts pre-authenticated via the `setup` project (Slice 19 C4) which
 * persists the e2e user's session to `.auth/novapay.json`, consumed by
 * each main project's `use.storageState` in playwright.config.ts.
 *
 * Selector discipline per SPEC §Slice 19:
 *   - Role-based queries only (no raw CSS / XPath).
 *   - No `page.waitForTimeout`; navigation uses URL regex waits.
 *
 * Data contract from Slice 19 B1/B2:
 *   - E2E user `e2e@novapay.test` is admin in the fixture workspace
 *     (slug `novapay-e2e`, `isE2eFixture=true`).
 *   - Fixture workspace contains a board named "Transaction Pipeline"
 *     with a Status column so the flow-5 automation has something to
 *     attach to.
 */

test.describe('Flow 1 — login and open board', () => {
  test('lands on BoardListPage and opens the Transaction Pipeline board', async ({
    page,
    a11yScan,
  }) => {
    // Enter the app. The persisted session short-circuits the login
    // form and react-router lands us at /boards.
    await page.goto('/');
    await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });

    // BoardListPage header — proves we reached the right page
    // (not the login form, not an error screen).
    await expect(
      page.getByRole('heading', { level: 1, name: 'Boards' })
    ).toBeVisible();

    // A11y audit #1 — BoardListPage post-render. The heading assertion
    // above proves the list has fully mounted, so the scan sees the
    // final DOM (not a loading state). Slice 19 E2.
    await a11yScan();

    // The seeded board renders as an interactive card (a <button>
    // styled as a card — see BoardListPage.tsx). Scope to the main
    // grid so the name match is unambiguous even if the word appears
    // elsewhere (sidebar, dialogs, etc.).
    const pipelineCard = page.getByRole('button', {
      name: /Transaction Pipeline/,
    });
    await expect(pipelineCard).toBeVisible();

    // Opening the board routes to /boards/<numeric-id>.
    await pipelineCard.click();
    await page.waitForURL(/\/boards\/\d+(?:\/|$|\?)/, { timeout: 10_000 });

    // BoardPage renders the board name as its own top-level heading.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
    ).toBeVisible();

    // Sanity: the board toolbar is interactive (confirms the board
    // view fully mounted, not a loading or error state).
    await expect(page.getByRole('button', { name: 'New Item' })).toBeVisible();

    // A11y audit #2 — BoardPage post-mount. The "New Item" toolbar
    // button being visible is our deterministic render proof (same
    // check the Flow 4 setup relies on). Slice 19 E2.
    await a11yScan();
  });
});
