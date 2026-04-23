import { test, expect } from '@playwright/test';
import { prepareForSnapshot } from '../../helpers/visual';

/**
 * Slice 19B Task D2 — Board-list visual baseline (NovaPay only).
 *
 * Scope note:
 *   The plan (plans/slice-19b-plan.md §Task D2) originally targeted 10
 *   industries × 1 snapshot = 10 baselines. After the Slice 19 review
 *   surfaced that only NovaPay has a real e2e fixture user seeded
 *   (see Slice 19 B1 — `e2e@novapay.test`), the 9 other industries
 *   cannot be authenticated end-to-end yet. A dedicated future slice
 *   must seed e2e users for MedVista, TrustGuard, UrbanNest, SwiftRoute,
 *   DentaFlow, JurisPath, TableSync, CraneStack, and EduPulse before
 *   their authenticated board-list snapshots can land here. Until
 *   then, this spec captures the single NovaPay baseline.
 *
 * State-based rendering note:
 *   NovaPay does NOT use react-router — App.tsx (frontends/novapay/
 *   src/App.tsx) gates on `useAuth().user` and renders `AppContent`
 *   once authenticated. The default `activeView` is `'overview'`, so
 *   navigating to `/` lands on the OverviewDashboard with the Sidebar
 *   showing the seeded boards (including "Transaction Pipeline").
 *   We snapshot that full authenticated landing viewport — sidebar +
 *   overview — because it's the stable post-login state the user
 *   actually sees first. Waiting on "Transaction Pipeline" proves
 *   the seeded board data has rendered before the screenshot fires.
 *
 * Auth reuse:
 *   The visual config (`playwright.visual.config.ts`) points both the
 *   `visual-desktop` and `visual-mobile` projects at
 *   `.auth/novapay.json`, the storage state written by Slice 19 C4's
 *   `auth.setup.ts`. No re-login is performed here — the state file is
 *   expected to exist on disk (run `npm test` once to seed it).
 *
 * Masking:
 *   `prepareForSnapshot` applies DEFAULT_MASKS (timestamps, avatar
 *   fallbacks, notification counts). The OverviewDashboard renders
 *   per-transaction timestamps from seeded data; masking matters.
 */

test.describe('board-list visual — NovaPay', () => {
  test('authenticated landing shows seeded boards', async ({ page }) => {
    await page.goto('/');

    // Stable render proof — the seeded "Transaction Pipeline" board
    // appears in the Sidebar once `getBoards()` resolves. Using
    // `.first()` is defensive in case the same label renders elsewhere
    // (e.g. the OverviewDashboard's board-summary card list).
    await page
      .getByText('Transaction Pipeline')
      .first()
      .waitFor({ timeout: 10_000 });

    const mask = await prepareForSnapshot(page);

    await expect(page).toHaveScreenshot('board-list-novapay.png', { mask });
  });
});
