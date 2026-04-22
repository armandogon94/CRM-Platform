import { test as base, expect } from '@playwright/test';
import { a11yScan as runA11yScan } from '../helpers/a11y';

/**
 * Shared Playwright `test` fixture (Slice 19 C5 / E1).
 *
 * Every spec under `e2e/specs/` should import `test` and `expect` from
 * this module instead of directly from `@playwright/test`, so future
 * cross-cutting concerns (a11y audits, seeded data hooks, shared
 * per-test telemetry) can be added without editing every spec.
 *
 * Current fixtures:
 *   - `a11yScan` — runs an axe-core scan of the current page (WCAG 2.1
 *     AA) and asserts zero un-justified serious/critical violations.
 *     Baseline suppression is handled by `helpers/a11y.ts`; each
 *     accepted exemption must carry a written justification in
 *     `e2e/a11y-baseline.json`. See Task E1.
 *
 * StorageState is NOT re-bound here — the three main Playwright
 * projects already wire `storageState: '.auth/novapay.json'` via
 * `use.storageState` in `playwright.config.ts` (Slice 19 C4). Putting
 * the binding in exactly one place keeps the auth source of truth
 * unambiguous.
 */

export type A11yScan = () => Promise<void>;

interface CrmFixtures {
  /**
   * Runs an accessibility audit against the current page and fails
   * the test if any serious/critical violation is not suppressed by
   * the project's a11y baseline.
   */
  a11yScan: A11yScan;
}

export const test = base.extend<CrmFixtures>({
  a11yScan: async ({ page }, use) => {
    const scan: A11yScan = async () => {
      const violations = await runA11yScan(page);
      if (violations.length === 0) {
        return;
      }
      const detail = violations
        .map((v) => `  - [${v.impact}] ${v.rule} @ ${v.selector}  (${v.helpUrl})`)
        .join('\n');
      // `expect` with a soft assertion would swallow the first failure
      // inside a beforeEach wrapper; throw instead so the full list is
      // visible in the test report's error column.
      throw new Error(
        `a11yScan found ${violations.length} un-baselined serious/critical violation(s):\n${detail}`,
      );
    };
    await use(scan);
  },
});

export { expect };
