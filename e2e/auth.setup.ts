import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright setup project (Slice 19 C4).
 *
 * Logs into the NovaPay frontend as the seeded e2e fixture user
 * (`e2e@novapay.test` / `e2epassword` — see Slice 19 B1) via the real
 * login UI, then persists the resulting auth cookies + localStorage to
 * `e2e/.auth/novapay.json`. The three main projects
 * (`desktop-novapay`, `desktop-branding-all`, `mobile-novapay`) declare
 * this project as a dependency and consume the saved `storageState`,
 * so individual specs start pre-authenticated.
 *
 * `.auth/` is covered by e2e/.gitignore — credentials never leave the
 * developer's machine.
 *
 * Selector discipline (SPEC §Slice 19 determinism requirements):
 *   getByLabel > getByRole > getByTestId. No raw CSS / XPath.
 */

const AUTH_STATE_FILE = path.resolve(__dirname, '.auth/novapay.json');

const NOVAPAY_E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e@novapay.test';
const NOVAPAY_E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'e2epassword';

setup('authenticate as NovaPay e2e user', async ({ page, baseURL }) => {
  // Defensive guard — without a baseURL, the login navigation below
  // would silently target the wrong origin.
  expect(baseURL, 'baseURL must be set on the setup project').toBeTruthy();

  await page.goto('/login');

  await page.getByLabel(/email/i).fill(NOVAPAY_E2E_EMAIL);
  await page.getByLabel(/password/i).fill(NOVAPAY_E2E_PASSWORD);
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();

  // Board list page is the post-login landing per SPEC §Slice 19 flow 1.
  await page.waitForURL(/\/boards(\/|$|\?)/, { timeout: 15_000 });

  // Sanity-check the session took — if login silently failed, the sidebar
  // user chip (or a logout affordance) would be absent.
  await expect(
    page.getByRole('button', { name: /log ?out|sign ?out/i })
      .or(page.getByRole('link', { name: /log ?out|sign ?out/i }))
  ).toBeVisible({ timeout: 5_000 });

  // Persist cookies + localStorage. Playwright creates parent dirs.
  await page.context().storageState({ path: AUTH_STATE_FILE });
});
