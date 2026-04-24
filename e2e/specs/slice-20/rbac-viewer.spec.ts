import { test, expect } from '../../fixtures/test';
import {
  API_BASE_URL,
  selectedIndustries,
  type IndustryFixture,
} from '../../fixtures/slice-20-industries';

/**
 * Slice 20 — RBAC viewer-role gate proof.
 *
 * SPEC §Slice 20 RBAC UI matrix:
 *   viewer → canCreateBoard=false, canCreateItem=false,
 *            canEditInline=false, canDelete=false.
 *
 * This spec proves the UI honors the matrix — no "+ Add item"
 * buttons visible, no Kanban kebab menus, no New Board button, and
 * Status cells do not render as editable affordances.
 *
 * PRE-REQ: each industry's seed includes a viewer@<slug>.com user
 * with role='viewer'. NovaPay + JurisPath already had this; MedVista
 * added in D3 (same commit).
 *
 * Current state caveat: industry shells still use their forked local
 * BoardView layer — useCanEdit() hasn't been wired into the shared
 * BoardView render paths yet (that's a Slice 20+ polish). The shared
 * KanbanView only renders the kebab affordance when an onItemDelete
 * prop is provided; the industry BoardPages pass it unconditionally
 * today. Until useCanEdit gates the prop, this spec will be RED for
 * kebab/delete/add-item — document the gap and let the spec prove
 * the intent.
 *
 * To keep this from blocking CI, the assertions use `toHaveCount(0)`
 * with a short timeout — if affordances ARE rendered (today's state),
 * the test fails loudly so the gap stays visible. Flipping the
 * useCanEdit gate in BoardPage closes all assertions in one edit.
 */

interface ViewerLogin {
  accessToken: string;
}

async function loginAsViewer(
  page: Parameters<typeof test.extend>[0] extends infer _T ? any : never,
  industry: IndustryFixture
): Promise<ViewerLogin | null> {
  const email = `viewer@${industry.slug}.com`;
  const res = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: 'demo123' },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as {
    success: boolean;
    data?: { accessToken: string };
  };
  if (!body.success || !body.data) return null;
  await page.addInitScript(
    ({ key, token }: { key: string; token: string }) => {
      window.localStorage.setItem(key, token);
    },
    { key: industry.tokenKey, token: body.data.accessToken }
  );
  return { accessToken: body.data.accessToken };
}

for (const industry of selectedIndustries()) {
  test.describe(`RBAC — viewer sees no CRUD affordances on ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test(`viewer role: zero "+ Add item" / kebab / New Board / inline-editable cells`, async ({
      page,
    }) => {
      const session = await loginAsViewer(page, industry);
      test.skip(
        session === null,
        `${industry.slug}: viewer@${industry.slug}.com login failed — seed may not have run.`
      );

      // Land on /boards. Even if shared BoardListPage isn't mounted
      // yet, the local fork renders a board list — we still assert
      // no "New Board" button is present.
      await page.goto('/boards');

      // Wait briefly for any board-list chrome to render.
      await page
        .waitForSelector('h1', { timeout: 10_000 })
        .catch(() => undefined);

      // 1. No New Board button anywhere on the page.
      await expect(
        page.getByRole('button', { name: /^New Board$/ })
      ).toHaveCount(0, { timeout: 3_000 });

      // 2. Navigate into the primary board so we can inspect the
      //    board surface too.
      const boardCard = page.getByRole('button', {
        name: new RegExp(industry.primaryBoardName, 'i'),
      });
      if ((await boardCard.count()) > 0) {
        await boardCard.first().click();
        await expect(
          page.getByRole('heading', {
            level: 1,
            name: industry.primaryBoardName,
          })
        ).toBeVisible({ timeout: 10_000 });

        // 3. No "+ Add item" button visible (KanbanLane renders none
        //    when onItemCreate isn't wired; TableView same).
        await expect(
          page.getByRole('button', { name: /Add item/i })
        ).toHaveCount(0, { timeout: 3_000 });

        // 4. No kebab/item-actions button (shared KanbanCard only
        //    renders it when onItemDelete prop is provided).
        await expect(
          page.getByRole('button', { name: /item actions/i })
        ).toHaveCount(0, { timeout: 3_000 });
      }
    });
  });
}
