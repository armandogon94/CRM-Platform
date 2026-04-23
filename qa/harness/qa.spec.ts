import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { findIndustry } from './industries';

/**
 * Slice 19.7 QA harness — one parameterised Playwright spec that runs
 * the full Tier-1 UI walkthrough + Tier-2 API CRUD checks for a single
 * industry.
 *
 * Invocation (driven by the shell orchestrator `run.sh`):
 *   INDUSTRY=novapay npx playwright test --config=qa/playwright.qa.config.ts
 *
 * Output artifacts written to `qa-results/<slug>/`:
 *   - screenshots/01-login.png … 10-logged-out.png
 *   - api-log.json      (raw request/response for Tier-2 operations)
 *   - findings.md       (per-step pass/fail + any bugs)
 */

const SLUG = process.env.INDUSTRY;
if (!SLUG) {
  throw new Error('INDUSTRY env var is required (e.g. INDUSTRY=novapay)');
}
const industry = findIndustry(SLUG);

const RESULTS_ROOT = path.resolve(__dirname, '../../qa-results', industry.slug);
const SCREENSHOTS_DIR = path.join(RESULTS_ROOT, 'screenshots');
const API_LOG_PATH = path.join(RESULTS_ROOT, 'api-log.json');
const FINDINGS_PATH = path.join(RESULTS_ROOT, 'findings.md');

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:13000';
const FRONTEND = `http://localhost:${industry.port}`;

interface StepLog {
  step: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}
const steps: StepLog[] = [];
const apiLog: Array<Record<string, unknown>> = [];
const consoleErrors: string[] = [];
const pageErrors: string[] = [];

function record(step: string, status: StepLog['status'], detail?: string): void {
  steps.push({ step, status, detail });
  // eslint-disable-next-line no-console
  console.log(`[${status.toUpperCase()}] ${step}${detail ? ` — ${detail}` : ''}`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
}

// Small fetch helper that logs every request/response for the api-log.
async function apiCall(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {}
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const started = Date.now();
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const elapsed = Date.now() - started;
  const textBody = await res.text();
  let parsed: unknown = textBody;
  try {
    parsed = JSON.parse(textBody);
  } catch {
    /* keep as text */
  }
  apiLog.push({
    t: new Date().toISOString(),
    method,
    path,
    status: res.status,
    elapsedMs: elapsed,
    response: parsed,
  });
  return { status: res.status, body: parsed };
}

test.describe(`Slice 19.7 QA — ${industry.company} (${industry.slug})`, () => {
  test.describe.configure({ mode: 'serial' });

  let primaryToken: string | null = null;
  let workspaceId: number | null = null;

  test('Tier 1 — UI walkthrough', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // --- Step 1: Load login page ---------------------------------------
    await page.goto(FRONTEND + '/');
    await expect(
      page.getByRole('heading', { name: /sign ?in|log ?in/i }).first()
    ).toBeVisible({ timeout: 15_000 });
    await shot(page, '01-login');
    record('1. Login page renders', 'pass');

    // --- Step 2: Submit credentials ------------------------------------
    // Fallback chain: getByLabel (a11y-compliant) → getByPlaceholder
    // (most industries lack htmlFor/id on labels — flagged as an a11y
    // finding in the cross-industry report).
    const emailInput = page
      .getByLabel(/email/i)
      .or(page.getByPlaceholder(/admin@|@|email/i))
      .or(page.locator('input[type="email"]'));
    const passwordInput = page
      .getByLabel(/password/i)
      .or(page.getByPlaceholder(/password/i))
      .or(page.locator('input[type="password"]'));

    await emailInput.first().fill(industry.adminEmail);
    await passwordInput.first().fill(industry.adminPassword);
    await page.getByRole('button', { name: /sign ?in|log ?in/i }).click();
    // Wait for a post-login affordance (logout button) to confirm auth.
    await expect(
      page
        .getByRole('button', { name: /log ?out|sign ?out/i })
        .or(page.getByRole('link', { name: /log ?out|sign ?out/i }))
    ).toBeVisible({ timeout: 15_000 });
    await shot(page, '02-post-login');
    record('2. Post-login redirect + session persists', 'pass');

    // --- Step 3: OverviewDashboard renders -----------------------------
    // Most industries land on a dashboard/overview. Look for common dash
    // affordances — KPI card with a number, or the word 'Dashboard'.
    const dashMarker = page
      .getByRole('heading', { name: /overview|dashboard|welcome/i })
      .or(page.getByText(/overview|dashboard/i).first());
    try {
      await expect(dashMarker).toBeVisible({ timeout: 5_000 });
      record('3. Dashboard/Overview renders', 'pass');
    } catch {
      record(
        '3. Dashboard/Overview renders',
        'warn',
        'No recognisable dashboard heading — industry may land on a different route'
      );
    }
    await shot(page, '03-dashboard');

    // --- Step 4: Navigate to a board ------------------------------------
    // Industries without react-router use sidebar buttons that set state.
    // Try both: a sidebar button by board name, OR a card/link with it.
    const boardLocator = page
      .getByRole('button', { name: new RegExp(industry.expectedPrimaryBoard, 'i') })
      .or(
        page.getByRole('link', {
          name: new RegExp(industry.expectedPrimaryBoard, 'i'),
        })
      );
    const boardFound = await boardLocator.first().isVisible().catch(() => false);
    if (boardFound) {
      await boardLocator.first().click();
      record(
        `4. Navigate to '${industry.expectedPrimaryBoard}'`,
        'pass'
      );
    } else {
      // Fall back: click the first sidebar board entry we can find.
      const fallback = page
        .getByRole('button', { name: /pipeline|records|policies|listings|shipments|appointments|cases|reservations|projects|courses/i })
        .first();
      if (await fallback.isVisible().catch(() => false)) {
        const txt = await fallback.textContent();
        await fallback.click();
        record(
          `4. Navigate to board`,
          'warn',
          `Expected '${industry.expectedPrimaryBoard}' not found; clicked '${txt?.trim()}'`
        );
      } else {
        record(
          `4. Navigate to board`,
          'fail',
          `Neither '${industry.expectedPrimaryBoard}' nor fallback board buttons found`
        );
      }
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, '04-board-table');

    // --- Step 5: Kanban view -------------------------------------------
    const kanbanToggle = page.getByRole('button', { name: /kanban/i });
    if (await kanbanToggle.isVisible().catch(() => false)) {
      await kanbanToggle.click();
      await page.waitForTimeout(500);
      await shot(page, '05-board-kanban');
      record('5. Kanban view toggle', 'pass');
    } else {
      record('5. Kanban view toggle', 'warn', 'Kanban button not found');
      await shot(page, '05-board-kanban');
    }

    // --- Step 6: Search --------------------------------------------------
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByRole('searchbox'));
    if (await searchInput.first().isVisible().catch(() => false)) {
      await searchInput.first().fill('a');
      await page.waitForTimeout(400);
      await shot(page, '06-search');
      record('6. Search input accepts query', 'pass');
      await searchInput.first().fill('');
    } else {
      record('6. Search input', 'warn', 'No search input detected');
      await shot(page, '06-search');
    }

    // --- Step 7: Navigate to 2nd board ----------------------------------
    // Find any other sidebar button matching a board-ish name.
    const secondBoard = page
      .getByRole('button', {
        name: /merchant|compliance|patient|appointment|claim|policy|property|listing|delivery|shipment|treatment|patient|contract|case|menu|reservation|project|crane|assignment|course/i,
      })
      .first();
    if (await secondBoard.isVisible().catch(() => false)) {
      await secondBoard.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '07-board-2');
      record('7. Switch to second board', 'pass');
    } else {
      record('7. Switch to second board', 'warn', 'No other board button found');
      await shot(page, '07-board-2');
    }

    // --- Step 8: Automations panel --------------------------------------
    const automationsBtn = page.getByRole('button', { name: /automation/i }).first();
    if (await automationsBtn.isVisible().catch(() => false)) {
      await automationsBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await shot(page, '08-automations');
      record('8. Automations panel opens', 'pass');
    } else {
      record('8. Automations panel', 'warn', 'No automations button');
      await shot(page, '08-automations');
    }

    // --- Step 9: Trigger automation (if any Trigger buttons) ------------
    const triggerBtn = page.getByRole('button', { name: /trigger/i }).first();
    if (await triggerBtn.isVisible().catch(() => false)) {
      await triggerBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, '09-triggered');
      record('9. Automation trigger button firable', 'pass');
    } else {
      record('9. Automation trigger', 'warn', 'No Trigger buttons found');
      await shot(page, '09-triggered');
    }

    // --- Step 10: Logout -------------------------------------------------
    const logoutBtn = page
      .getByRole('button', { name: /log ?out|sign ?out/i })
      .or(page.getByRole('link', { name: /log ?out|sign ?out/i }))
      .first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
      await expect(
        page.getByRole('heading', { name: /sign ?in|log ?in/i }).first()
      ).toBeVisible({ timeout: 10_000 });
      await shot(page, '10-logged-out');
      record('10. Logout returns to login page', 'pass');
    } else {
      record('10. Logout', 'fail', 'No logout button found');
      await shot(page, '10-logged-out');
    }

    // Console/page error cumulative check
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      record('  Console + page errors', 'pass', '0 / 0');
    } else {
      record(
        '  Console + page errors',
        'warn',
        `console=${consoleErrors.length} page=${pageErrors.length}`
      );
    }
  });

  test('Tier 2 — API CRUD checks', async () => {
    // 1. Login via API to get a token + workspace id
    const login = await apiCall('POST', '/api/v1/auth/login', {
      body: { email: industry.adminEmail, password: industry.adminPassword },
    });
    if (login.status !== 200) {
      record('T2-1. API login', 'fail', `status=${login.status}`);
      return;
    }
    const loginBody = login.body as { data?: { accessToken?: string; user?: { workspaceId?: number } } };
    primaryToken = loginBody.data?.accessToken ?? null;
    workspaceId = loginBody.data?.user?.workspaceId ?? null;
    record('T2-1. API login', primaryToken ? 'pass' : 'fail');
    if (!primaryToken || !workspaceId) return;

    // 2. Create a QA board via API. Boards create at the NESTED path
    //    `/workspaces/:wsId/boards` — the top-level `/boards` only
    //    supports GET. FINDING: the shared library's BoardListPage uses
    //    the wrong path for POST; flag in the final report.
    const boardName = 'Slice 19.7 QA Board';
    const createBoard = await apiCall(
      'POST',
      `/api/v1/workspaces/${workspaceId}/boards`,
      {
        token: primaryToken,
        body: {
          name: boardName,
          description: 'Created by the Slice 19.7 QA harness.',
          boardType: 'main',
        },
      }
    );
    const createdBoardId =
      (createBoard.body as { data?: { board?: { id?: number } } })?.data?.board?.id ?? null;
    record(
      'T2-2. POST /workspaces/:wsId/boards',
      createBoard.status === 200 || createBoard.status === 201 ? 'pass' : 'fail',
      `status=${createBoard.status} id=${createdBoardId}`
    );

    // 3. Create a test item (requires a group on the board — boards created
    //    without groups don't accept items yet, so we fetch the board first
    //    to see if it has an auto-seeded group).
    if (createdBoardId) {
      const getBoard = await apiCall(
        'GET',
        `/api/v1/workspaces/${workspaceId}/boards/${createdBoardId}`,
        { token: primaryToken }
      );
      const groups =
        (getBoard.body as { data?: { board?: { groups?: Array<{ id: number }> } } })?.data?.board?.groups ?? [];
      if (groups.length > 0) {
        const createItem = await apiCall('POST', '/api/v1/items', {
          token: primaryToken,
          body: {
            boardId: createdBoardId,
            groupId: groups[0].id,
            name: 'QA Test Item',
          },
        });
        const itemId =
          (createItem.body as { data?: { item?: { id?: number } } })?.data?.item?.id ?? null;
        record(
          'T2-3. POST /items',
          createItem.status === 200 || createItem.status === 201 ? 'pass' : 'fail',
          `status=${createItem.status} id=${itemId}`
        );

        // 4. Delete the item (cleanup + DELETE-path coverage).
        //    DELETE is nested under workspaces/:wsId/boards/:boardId/items.
        if (itemId) {
          const del = await apiCall(
            'DELETE',
            `/api/v1/workspaces/${workspaceId}/boards/${createdBoardId}/items/${itemId}`,
            { token: primaryToken }
          );
          record(
            'T2-4. DELETE /items/:id (nested)',
            del.status === 200 || del.status === 204 ? 'pass' : 'fail',
            `status=${del.status}`
          );
        }
      } else {
        record(
          'T2-3. POST /items',
          'warn',
          'Board has no groups — skipping item create (expected for bare boards)'
        );
      }

      // 5. Clean up the QA board
      const delBoard = await apiCall(
        'DELETE',
        `/api/v1/workspaces/${workspaceId}/boards/${createdBoardId}`,
        { token: primaryToken }
      );
      record(
        'T2-5. DELETE /boards/:id (cleanup)',
        delBoard.status === 200 || delBoard.status === 204 ? 'pass' : 'fail',
        `status=${delBoard.status}`
      );
    }

    // 6. Sanity: notifications endpoint reachable
    const notifs = await apiCall('GET', '/api/v1/notifications', { token: primaryToken });
    record(
      'T2-6. GET /notifications',
      notifs.status === 200 ? 'pass' : 'fail',
      `status=${notifs.status}`
    );
  });

  test.afterAll(async () => {
    // Persist api log + findings.md regardless of pass/fail above.
    fs.writeFileSync(API_LOG_PATH, JSON.stringify(apiLog, null, 2), 'utf8');

    const passed = steps.filter((s) => s.status === 'pass').length;
    const warned = steps.filter((s) => s.status === 'warn').length;
    const failed = steps.filter((s) => s.status === 'fail').length;

    const md = [
      `# ${industry.company} QA — Slice 19.7`,
      '',
      `**Slug:** \`${industry.slug}\``,
      `**Port:** ${industry.port}`,
      `**Admin user:** \`${industry.adminEmail}\``,
      `**Brand primary:** \`${industry.brandColor}\``,
      '',
      `## Result Summary`,
      '',
      `- Passed: **${passed}**`,
      `- Warnings: **${warned}**`,
      `- Failed: **${failed}**`,
      `- Console errors captured: **${consoleErrors.length}**`,
      `- Page errors captured: **${pageErrors.length}**`,
      '',
      `## Steps`,
      '',
      ...steps.map(
        (s) =>
          `- [${s.status === 'pass' ? 'x' : ' '}] ${s.step}${s.detail ? ` — _${s.detail}_` : ''}`
      ),
      '',
      '## Console errors',
      '',
      ...(consoleErrors.length === 0
        ? ['_None_']
        : consoleErrors.map((e) => `- \`${e.replace(/`/g, "'")}\``)),
      '',
      '## Page errors',
      '',
      ...(pageErrors.length === 0
        ? ['_None_']
        : pageErrors.map((e) => `- \`${e.replace(/`/g, "'")}\``)),
      '',
      '## Artifacts',
      '',
      `- Screenshots: \`qa-results/${industry.slug}/screenshots/\` (10 PNGs)`,
      `- API log: \`qa-results/${industry.slug}/api-log.json\` (${apiLog.length} requests)`,
      '',
    ].join('\n');

    fs.writeFileSync(FINDINGS_PATH, md, 'utf8');
  });
});
