import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { prepareForSnapshot } from '../../helpers/visual';

/**
 * Slice 19B Task D3 — per-view visual baselines for NovaPay's
 * "Transaction Pipeline" seeded board.
 *
 * The plan calls for 8 views × 10 industries = 80 baselines. Two
 * architectural realities cap this task at 8 baselines:
 *
 *   1. The Slice 19 B1 e2e fixture only seeds a NovaPay workspace
 *      (`e2e@novapay.test`, workspace slug `novapay-e2e`). The other
 *      nine industries have no e2e user, so they cannot be reached via
 *      the persisted storageState that `playwright.visual.config.ts`
 *      relies on. Expanding to the full 80 requires a multi-industry
 *      fixture seeder — tracked separately, see the commit body.
 *   2. NovaPay's `frontends/novapay/src/components/BoardPage.tsx` only
 *      renders Table + Kanban. The shared BoardPage at
 *      `frontends/_shared/src/pages/BoardPage.tsx` renders all 8 views
 *      driven by the same `VIEW_LABELS` tab set that the functional
 *      spec (`specs/04-all-eight-views.spec.ts`) already navigates, and
 *      that is the surface the e2e harness actually reaches at
 *      `http://localhost:13001`. Selectors below mirror Flow 4 verbatim
 *      so any Flow-4 regression also surfaces here.
 *
 * Determinism notes (SPEC §Slice 19B):
 *   - `prepareForSnapshot` handles fonts/networkidle/animation-off.
 *   - `DEFAULT_MASKS` cover timestamp/avatar/notification-count drift.
 *   - MapView adds `.leaflet-attribution` because the attribution tile
 *     URL carries runtime tokens (plan §Risks and plans/slice-19b-plan.md
 *     D3 acceptance bullet: "MapView specifically masks the Leaflet
 *     attribution tile"). The Open Question in the plan is resolved in
 *     favour of keeping the mask — cheaper to keep than to re-discover
 *     flake on CI.
 *
 * Test isolation:
 *   Each view is its own `test()` so failure attribution is per-view
 *   (not per-matrix). `beforeEach` re-navigates from scratch so no
 *   state leaks between views — important because the BoardPage
 *   keeps `activeView` in component state that would otherwise carry
 *   across.
 */

interface ViewDescriptor {
  /** Label on the view-tab button (matches VIEW_LABELS in BoardPage). */
  readonly label: string;
  /** File-name slug for the snapshot PNG. */
  readonly slug: string;
  /**
   * Locator factory returning the element that proves the view
   * finished mounting. Copied from `specs/04-all-eight-views.spec.ts`
   * so Flow 4's testid additions (D4 in Slice 19) stay authoritative.
   */
  readonly locate: (page: Page) => Locator;
  /**
   * Views that fetch on mount — gate the snapshot on that request so
   * the screenshot is not racing an in-flight XHR. Mirrors Flow 4.
   */
  readonly dataDriven: boolean;
  /**
   * Additional selectors to feed into `prepareForSnapshot`'s
   * `extraMasks`. Currently only MapView needs one — see header.
   */
  readonly extraMasks?: readonly string[];
}

const VIEWS: readonly ViewDescriptor[] = [
  {
    label: 'Table',
    slug: 'table',
    dataDriven: false,
    locate: (page) => page.getByTestId('table-view'),
  },
  {
    label: 'Kanban',
    slug: 'kanban',
    dataDriven: false,
    locate: (page) => page.getByTestId('kanban-view'),
  },
  {
    label: 'Calendar',
    slug: 'calendar',
    dataDriven: true,
    // Fixture board has no date column → empty-state paragraph renders.
    locate: (page) => page.getByText(/No date column found/i),
  },
  {
    label: 'Timeline',
    slug: 'timeline',
    dataDriven: true,
    // Fixture board has no timeline column → empty-state paragraph.
    locate: (page) => page.getByText(/No timeline or date column found/i),
  },
  {
    label: 'Chart',
    slug: 'chart',
    dataDriven: true,
    // Fixture board has a Status column → ChartView renders this h3.
    locate: (page) =>
      page.getByRole('heading', { level: 3, name: 'Items by Status' }),
  },
  {
    label: 'Form',
    slug: 'form',
    dataDriven: false,
    locate: (page) =>
      page.getByRole('heading', { level: 2, name: 'Add New Item' }),
  },
  {
    label: 'Dashboard',
    slug: 'dashboard',
    dataDriven: true,
    // Either the loading spinner (pre-fetch) or the populated grid
    // (post-fetch) is a valid mount proof — matches Flow 4.
    locate: (page) =>
      page
        .getByTestId('dashboard-grid')
        .or(page.getByTestId('dashboard-loading')),
  },
  {
    label: 'Map',
    slug: 'map',
    dataDriven: true,
    locate: (page) => page.getByTestId('map-no-location'),
    // Leaflet's attribution overlay contains a tile-URL token that
    // differs between runs. Mask it specifically here (SPEC §Slice 19B
    // "Flake prevention" guidance; plans/slice-19b-plan.md D3 bullet).
    extraMasks: ['.leaflet-attribution'],
  },
];

/** Matches the read endpoints the data-driven views hit on mount. */
const DATA_URL_PATTERN = /\/items|\/aggregates|\/boards\//;

test.describe('Slice 19B D3 — NovaPay per-view visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    // Enter the app — persisted storageState from Slice 19 C4 lands
    // us on /boards without re-doing the login form.
    await page.goto('/');

    // Open the Transaction Pipeline board. `.first()` per the task
    // brief — guards against accidental duplicate renders in the
    // sidebar vs. main grid.
    await page.getByText('Transaction Pipeline').first().click();

    // BoardPage renders the board name as the page's <h1>. Waiting on
    // this proves the view mounted before any per-view tab click.
    await page
      .getByRole('heading', { level: 1, name: /Transaction Pipeline/ })
      .waitFor();
  });

  for (const view of VIEWS) {
    test(`${view.label} view renders`, async ({ page }) => {
      // Exact match — view tab labels are single-word and distinct.
      const tab = page.getByRole('button', { name: new RegExp(`^${view.label}$`, 'i') });
      await expect(tab).toBeVisible();

      if (view.dataDriven) {
        // Gate the mount assertion on the fetch so the later
        // prepareForSnapshot `networkidle` wait does not trip a race
        // where the request is still in-flight. `.catch(() => null)`
        // absorbs cache-hit responses that resolve before we await.
        const responsePromise = page
          .waitForResponse((res) => DATA_URL_PATTERN.test(res.url()), {
            timeout: 10_000,
          })
          .catch(() => null);
        await tab.click();
        await responsePromise;
      } else {
        await tab.click();
      }

      // Wait for the view's distinct mount-proof element before snapshotting.
      await expect(view.locate(page)).toBeVisible();

      const mask = await prepareForSnapshot(page, {
        extraMasks: view.extraMasks ?? [],
      });

      await expect(page).toHaveScreenshot(`board-${view.slug}-novapay.png`, {
        mask,
      });
    });
  }
});
