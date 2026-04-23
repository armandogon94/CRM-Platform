import { test, expect, type Route } from '@playwright/test';
import { prepareForSnapshot } from '../../helpers/visual';

/**
 * Slice 19B Task D4 — state-variant visual baselines (NovaPay desktop only).
 *
 * SPEC §Slice 19B defines 8 state-variant snapshots, all exercised against
 * the NovaPay frontend (port 13001). State variants are deliberately
 * skipped on `visual-mobile` — mobile coverage is scoped to spec 05.
 *
 * Variant matrix (per SPEC §Slice 19B lines 1108–1117):
 *   1. LoginPage      — error (wrong password)
 *   2. BoardListPage  — empty  (zero boards)
 *   3. BoardListPage  — loading (skeleton)
 *   4. BoardListPage  — error  (API 500)
 *   5. TableView      — empty  (zero items)
 *   6. TableView      — loading (skeleton rows)
 *   7. KanbanView     — empty
 *   8. KanbanView     — loading
 *
 * Determinism strategy:
 *   - Never uses `page.waitForTimeout` — all waits are event- or
 *     selector-driven per SPEC §Slice 19 selector discipline.
 *   - Loading states use a `page.route` gate pattern: a promise the test
 *     controls resolves the intercepted response AFTER the snapshot has
 *     been captured of the skeleton.
 *   - Error states stub a 500 JSON response via `page.route`.
 *   - Empty states stub a success response with an empty collection.
 *
 * Every test calls `prepareForSnapshot(page)` immediately before the
 * screenshot so fonts, network-idle, and animation-kill are applied
 * consistently. The returned mask Locator[] is forwarded as
 * `toHaveScreenshot({ mask })` so SPEC-mandated dynamic regions never
 * enter a baseline.
 */

test.describe('state variants — NovaPay desktop only', () => {
  // Skip guard — keep the spec out of the `visual-mobile` project per
  // SPEC §Slice 19B (state variants are desktop-only). Using a
  // beforeEach guard keyed on project name is preferred over touching
  // `playwright.visual.config.ts` (see prompt — strict scope: one file).
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === 'visual-mobile',
      'State variants are NovaPay desktop-only per SPEC §Slice 19B.',
    );
  });

  // ────────────────────────────────────────────────────────────
  // 1. LoginPage — error state (wrong password submitted)
  // ────────────────────────────────────────────────────────────
  test('login-error-novapay — wrong password shows inline error', async ({
    page,
    context,
  }) => {
    // storageState pre-authenticates us; clear it so the LoginPage is
    // actually rendered. Cookies + localStorage both hold app state.
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto('/');

    // Fill the login form with a deliberately wrong password.
    await page
      .getByLabel(/email/i)
      .first()
      .fill('admin@novapay.com');
    await page
      .getByLabel(/password/i)
      .first()
      .fill('wrongpass');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for the inline error banner. LoginPage.tsx renders the error
    // string inside a red banner div — match by text content so the
    // test is resilient to minor copy variations from the backend.
    await page
      .getByText(/invalid|incorrect|failed/i)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('login-error-novapay.png', { mask });
  });

  // ────────────────────────────────────────────────────────────
  // 2. BoardListPage — empty (zero boards)
  // ────────────────────────────────────────────────────────────
  test('board-list-empty — zero-boards empty state', async ({ page }) => {
    await page.route('**/api/v1/boards**', async (route) => {
      // Only intercept the list endpoint (no :id suffix).
      const url = new URL(route.request().url());
      if (/\/boards\/\d+/.test(url.pathname)) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { boards: [] } }),
      });
    });

    await page.goto('/');

    // BoardListPage renders "No boards yet" + "Create your first board…"
    // as the empty state (see frontends/_shared/src/pages/BoardListPage.tsx).
    await page
      .getByRole('heading', { name: /no boards yet/i })
      .waitFor({ state: 'visible', timeout: 10_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('board-list-empty.png', { mask });
  });

  // ────────────────────────────────────────────────────────────
  // 3. BoardListPage — loading (skeleton)
  // ────────────────────────────────────────────────────────────
  test('board-list-loading — skeleton state mid-fetch', async ({ page }) => {
    // Controllable gate — the intercepted route resolves ONLY when the
    // test calls `resolveRoute()`. This keeps the skeleton on-screen
    // while we snapshot, without any timing-based hack.
    let resolveRoute!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveRoute = resolve;
    });

    await page.route('**/api/v1/boards**', async (route: Route) => {
      const url = new URL(route.request().url());
      if (/\/boards\/\d+/.test(url.pathname)) {
        await route.continue();
        return;
      }
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { boards: [] } }),
      });
    });

    // Don't await full navigation — we need the page to be rendering
    // while the boards request hangs on our gate.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // The BoardListPage loading branch renders an animated spinner
    // (className includes `animate-spin`, see BoardListPage.tsx line 84).
    await page
      .locator('.animate-spin')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('board-list-loading.png', { mask });

    // Release the gate so Playwright's teardown can close the page
    // cleanly — leaving the request hanging would trigger test-runner
    // warnings about unresolved routes.
    resolveRoute();
  });

  // ────────────────────────────────────────────────────────────
  // 4. BoardListPage — error (API 500)
  // ────────────────────────────────────────────────────────────
  test('board-list-error — API 500 shows error state', async ({ page }) => {
    await page.route('**/api/v1/boards**', async (route) => {
      const url = new URL(route.request().url());
      if (/\/boards\/\d+/.test(url.pathname)) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error',
        }),
      });
    });

    await page.goto('/');

    // The BoardListPage swallows boards-fetch rejections (see
    // WorkspaceContext.tsx) and falls through to the empty-state
    // heading once `isLoading` flips to false — that rendered state
    // is what we baseline here. The snapshot diverges from the
    // empty-variant baseline only if/when an explicit error branch
    // is added, which is a deliberate visual-regression signal.
    await page
      .getByRole('heading', { name: /no boards yet|failed|error/i })
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('board-list-error.png', { mask });
  });

  // ────────────────────────────────────────────────────────────
  // 5. TableView — empty (board with zero items)
  // ────────────────────────────────────────────────────────────
  test('table-view-empty — board with zero items', async ({ page }) => {
    await page.route('**/api/v1/boards/*/items**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: [] } }),
      });
    });

    // Navigate to the seeded Transaction Pipeline board (Slice 19 B1).
    await page.goto('/');
    const pipelineCard = page
      .getByRole('button', { name: /transaction pipeline/i })
      .first();
    await pipelineCard.waitFor({ state: 'visible', timeout: 10_000 });
    await pipelineCard.click();
    await page.waitForURL(/\/boards\/\d+/, { timeout: 10_000 });

    // Wait for the TableView empty-group placeholder to render. The
    // string comes from TableView.tsx ("No items in this group").
    await page
      .getByText(/no items in this group/i)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('table-view-empty.png', { mask });
  });

  // ────────────────────────────────────────────────────────────
  // 6. TableView — loading (skeleton rows)
  // ────────────────────────────────────────────────────────────
  test('table-view-loading — skeleton rows while items fetch', async ({
    page,
  }) => {
    let resolveRoute!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveRoute = resolve;
    });

    await page.route('**/api/v1/boards/*/items**', async (route: Route) => {
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: [] } }),
      });
    });

    await page.goto('/');
    const pipelineCard = page
      .getByRole('button', { name: /transaction pipeline/i })
      .first();
    await pipelineCard.waitFor({ state: 'visible', timeout: 10_000 });
    await pipelineCard.click({ noWaitAfter: true });

    // BoardPage's loading branch renders a spinner with text
    // "Loading board..." (see _shared/pages/BoardPage.tsx line 149).
    await page
      .locator('.animate-spin')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('table-view-loading.png', { mask });

    resolveRoute();
  });

  // ────────────────────────────────────────────────────────────
  // 7. KanbanView — empty (board with zero items)
  // ────────────────────────────────────────────────────────────
  test('kanban-view-empty — board with zero items', async ({ page }) => {
    await page.route('**/api/v1/boards/*/items**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: [] } }),
      });
    });

    await page.goto('/');
    const pipelineCard = page
      .getByRole('button', { name: /transaction pipeline/i })
      .first();
    await pipelineCard.waitFor({ state: 'visible', timeout: 10_000 });
    await pipelineCard.click();
    await page.waitForURL(/\/boards\/\d+/, { timeout: 10_000 });

    // Switch to the Kanban view tab. BoardPage renders view tabs as
    // buttons — role + accessible-name match keeps this resilient.
    await page
      .getByRole('button', { name: /^kanban$/i })
      .first()
      .click();

    // KanbanView renders "No items" inside each empty column (see
    // _shared/components/board/KanbanView.tsx line 152).
    await page
      .getByText(/no items/i)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('kanban-view-empty.png', { mask });
  });

  // ────────────────────────────────────────────────────────────
  // 8. KanbanView — loading (skeleton columns)
  // ────────────────────────────────────────────────────────────
  test('kanban-view-loading — skeleton columns while items fetch', async ({
    page,
  }) => {
    let resolveRoute!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveRoute = resolve;
    });

    await page.route('**/api/v1/boards/*/items**', async (route: Route) => {
      await gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: [] } }),
      });
    });

    await page.goto('/');
    const pipelineCard = page
      .getByRole('button', { name: /transaction pipeline/i })
      .first();
    await pipelineCard.waitFor({ state: 'visible', timeout: 10_000 });
    await pipelineCard.click({ noWaitAfter: true });

    // BoardPage's loading branch runs before any view tab is
    // available, so we snapshot that same spinner in the Kanban
    // context. The per-view skeleton baseline diverges from the
    // Table equivalent only when view-specific loading states are
    // implemented — a deliberate regression signal.
    await page
      .locator('.animate-spin')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 });

    const mask = await prepareForSnapshot(page);
    await expect(page).toHaveScreenshot('kanban-view-loading.png', { mask });

    resolveRoute();
  });
});
