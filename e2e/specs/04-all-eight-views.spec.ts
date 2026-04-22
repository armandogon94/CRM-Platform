import { test, expect } from '../fixtures/test';
import type { ConsoleMessage, Locator, Page } from '@playwright/test';

/**
 * Slice 19 — Flow 4: All 8 board views mount without console / page errors.
 *
 * The fixture workspace (Slice 19 B1) seeds a "Transaction Pipeline" board
 * whose column set is deliberately minimal (a single Status column), so the
 * data-driven views (Calendar, Timeline, Map) will render their empty-state
 * placeholders rather than a populated grid. The spec asserts MOUNT, not
 * data — per SPEC §Slice 19 Flow 4: "each view dispatches cleanly and no
 * view throws a runtime error when a user clicks its tab".
 *
 * Selector discipline (SPEC §Slice 19 Tooling):
 *   - Role-based queries or a small, auditable set of `data-testid`s.
 *   - No CSS / XPath / waitForTimeout.
 *
 * Test-id budget:
 *   - `table-view`   — added to TableView outer container (TableView has no
 *                      native landmark when board has zero groups).
 *   - `kanban-view`  — added to KanbanView outer flex container (Kanban lanes
 *                      have no top-level role; h3 lane labels depend on data).
 *   - `dashboard-grid` / `dashboard-loading` — already present in DashboardView.
 *   - `map-no-location` — already present in MapView for the no-location path.
 *
 * Other views identify themselves by unambiguous heading text:
 *   - Calendar → empty-state paragraph "No date column found..." (fixture
 *     board has no date column).
 *   - Timeline → empty-state paragraph "No timeline or date column found...".
 *   - Chart    → h3 "Items by Status" (fixture board has a Status column).
 *   - Form     → h2 "Add New Item".
 */

type ViewDescriptor = {
  /** Label rendered on the view-tab button (VIEW_LABELS in BoardPage.tsx). */
  readonly label: string;
  /**
   * Whether the view loads data via an API call on mount. Data-driven views
   * get a `page.waitForResponse` gate BEFORE the visibility assertion so the
   * mount check is not racing an in-flight fetch.
   */
  readonly dataDriven: boolean;
  /** Locator factory returning a unique element that proves the view mounted. */
  readonly locate: (page: Page) => Locator;
};

const VIEWS: readonly ViewDescriptor[] = [
  {
    label: 'Table',
    dataDriven: false,
    locate: (page) => page.getByTestId('table-view'),
  },
  {
    label: 'Kanban',
    dataDriven: false,
    locate: (page) => page.getByTestId('kanban-view'),
  },
  {
    label: 'Calendar',
    dataDriven: true,
    locate: (page) => page.getByText(/No date column found/i),
  },
  {
    label: 'Timeline',
    dataDriven: true,
    locate: (page) => page.getByText(/No timeline or date column found/i),
  },
  {
    label: 'Chart',
    dataDriven: true,
    // ChartView renders an <h3> "Items by Status" whenever a Status column
    // exists on the board — the fixture board always has one.
    locate: (page) =>
      page.getByRole('heading', { level: 3, name: 'Items by Status' }),
  },
  {
    label: 'Form',
    dataDriven: false,
    locate: (page) =>
      page.getByRole('heading', { level: 2, name: 'Add New Item' }),
  },
  {
    label: 'Dashboard',
    dataDriven: true,
    // DashboardView fetches /boards/:id/aggregates; either the loading spinner
    // (pre-fetch) or the grid (post-fetch) proves the component mounted.
    locate: (page) =>
      page.getByTestId('dashboard-grid').or(page.getByTestId('dashboard-loading')),
  },
  {
    label: 'Map',
    dataDriven: true,
    locate: (page) => page.getByTestId('map-no-location'),
  },
];

/** Matches the read endpoints the data-driven views hit on mount. */
const DATA_URL_PATTERN = /\/items|\/aggregates|\/boards\//;

test.describe('Flow 4 — all 8 views mount cleanly', () => {
  test('switches through Table/Kanban/Calendar/Timeline/Chart/Form/Dashboard/Map without console or page errors', async ({
    page,
  }) => {
    // Attach listeners BEFORE any navigation so errors raised during initial
    // board load are captured the same way as errors during view switching.
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err: Error) => {
      pageErrors.push(err.message);
    });

    // Enter the app — persisted storageState lands us on /boards.
    await page.goto('/');
    await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });

    // Open the fixture board (mirrors 01-login-and-board.spec.ts).
    const pipelineCard = page.getByRole('button', {
      name: /Transaction Pipeline/,
    });
    await expect(pipelineCard).toBeVisible();
    await pipelineCard.click();
    await page.waitForURL(/\/boards\/\d+(?:\/|$|\?)/, { timeout: 10_000 });

    // Wait for the board page to fully mount — we use the same sanity check
    // as Flow 1 so any regression there surfaces consistently.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Transaction Pipeline' })
    ).toBeVisible();

    for (const view of VIEWS) {
      await test.step(`switch to ${view.label}`, async () => {
        const tab = page.getByRole('button', { name: view.label, exact: true });
        await expect(tab).toBeVisible();

        if (view.dataDriven) {
          // Gate the visibility assertion on the mount-time fetch so we do
          // not flake if the API is mid-flight. The response can arrive
          // synchronously for cached endpoints — `{ timeout }` absorbs that
          // without resorting to waitForTimeout.
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

        await expect(view.locate(page)).toBeVisible();
      });
    }

    // Any error on any step is a regression — include the captured messages
    // in the failure output so CI logs are self-explanatory.
    expect(
      consoleErrors,
      `unexpected console.error: ${consoleErrors.join(' | ')}`
    ).toEqual([]);
    expect(
      pageErrors,
      `unexpected page error: ${pageErrors.join(' | ')}`
    ).toEqual([]);
  });
});
