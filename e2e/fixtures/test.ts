import { test as base, expect } from '@playwright/test';

/**
 * Shared Playwright `test` fixture (Slice 19 C5).
 *
 * Every spec under `e2e/specs/` should import `test` and `expect` from
 * this module instead of directly from `@playwright/test`, so future
 * cross-cutting concerns (a11y audits, seeded data hooks, shared
 * per-test telemetry) can be added without editing every spec.
 *
 * Current fixtures:
 *   - `a11yScan` — stub that Task E1 will replace with the real
 *     `@axe-core/playwright` wrapper. Returns a callable so specs
 *     written against C5's signature continue to compile when E1 lands.
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
   * Runs an accessibility audit against the current page. Slice 19 C5
   * ships a stub — call sites that wire this in (specs 01–05) will
   * upgrade automatically when Task E1 replaces the implementation.
   */
  a11yScan: A11yScan;
}

export const test = base.extend<CrmFixtures>({
  a11yScan: async ({ page }, use) => {
    const scan: A11yScan = async () => {
      // Touch `page` so the stub honours the fixture contract; real
      // implementation in E1 will run `new AxeBuilder({ page }).analyze()`.
      void page;
      // Intentionally silent — E1 wires the real axe-core call.
    };
    await use(scan);
  },
});

export { expect };
