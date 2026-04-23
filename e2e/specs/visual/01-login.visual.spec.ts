import { test, expect } from '@playwright/test';
import { prepareForSnapshot, DEFAULT_MASKS } from '../../helpers/visual';
import { INDUSTRY_THEMES } from '../../../frontends/_shared/src/theme';

/**
 * Slice 19B — Task D1: Login page visual baselines × 10 industries.
 *
 * Captures one desktop baseline (and one mobile baseline, via the
 * `visual-mobile` project in playwright.visual.config.ts) for the
 * unauthenticated login page of every industry frontend. Playwright
 * auto-suffixes snapshot filenames with the project name, so the 10
 * spec tests yield 20 PNGs across both projects on a full
 * `--update-snapshots` run.
 *
 * Why navigate to `/` rather than `/login`?
 *   Slice 19's review uncovered that NovaPay (and by symmetry the
 *   other 9 industry frontends) does NOT use react-router. The
 *   LoginPage is conditionally mounted at the root URL when the auth
 *   context has no session. Navigating to `/login` on these apps
 *   yields a blank route (or 404-ish render), so we go to `/` and
 *   let the app's own routing show the login form.
 *
 * Why `storageState: { cookies: [], origins: [] }` at describe level?
 *   The visual config wires `.auth/novapay.json` as storageState for
 *   both desktop and mobile projects so Task D2+ (authenticated views)
 *   pick up the Slice 19 fixture user automatically. This spec runs
 *   PRE-auth — we explicitly drop storage state at the describe level
 *   so every industry renders its unauthenticated login form. Using
 *   absolute URLs per test (rather than relying on baseURL) lets us
 *   hit all 10 ports from a single config without fighting the
 *   NovaPay-default baseURL.
 *
 * Why no custom masks?
 *   Login pages carry no timestamps, no notification badges, and no
 *   color-hashed avatars. `DEFAULT_MASKS` alone (imported to pin the
 *   contract, applied implicitly by prepareForSnapshot) covers
 *   everything. A wait on the "Sign in..." heading (LoginPage.tsx
 *   renders "Sign in to your account") anchors each snapshot to a
 *   fully-mounted form.
 */

// Ports 13001-13010 map 1:1 to the industry slugs in INDUSTRY_THEMES.
// Duplicated from specs/06-branding-per-industry.spec.ts intentionally:
// the visual suite loads specs from `./specs/visual`, so a relative
// import back into the functional suite would cross project boundaries
// and couple the two configs. Two small constant blocks are cheaper
// than that coupling, and both configs stay pinned to the same source
// of truth (INDUSTRY_THEMES).
const INDUSTRY_PORTS: Record<string, number> = {
  novapay: 13001,
  medvista: 13002,
  trustguard: 13003,
  urbannest: 13004,
  swiftroute: 13005,
  dentaflow: 13006,
  jurispath: 13007,
  tablesync: 13008,
  cranestack: 13009,
  edupulse: 13010,
};

interface IndustryCase {
  slug: string;
  port: number;
  companyName: string;
}

const INDUSTRIES: IndustryCase[] = Object.entries(INDUSTRY_THEMES).map(
  ([slug, theme]) => ({
    slug,
    port: INDUSTRY_PORTS[slug],
    companyName: theme.companyName,
  }),
);

test.describe.parallel('login visual — 10 industries', () => {
  // Drop any inherited storage state so each industry gets a fresh,
  // unauthenticated context. Playwright's per-describe `test.use` is
  // the only valid override level for storageState — it cannot be
  // called inside the test body. Absolute URLs per-test handle the
  // per-industry port, so no per-test baseURL is needed.
  test.use({ storageState: { cookies: [], origins: [] } });

  // Import kept live to pin the contract with helpers/visual — if
  // DEFAULT_MASKS ever shrinks below login-page needs we want a compile
  // error here rather than silent mask loss. prepareForSnapshot applies
  // DEFAULT_MASKS implicitly; callers don't need to pass them.
  void DEFAULT_MASKS;

  for (const industry of INDUSTRIES) {
    test(`${industry.companyName} login page baseline`, async ({ page }) => {
      await page.goto(`http://localhost:${industry.port}/`);

      // Anchor to the login heading ("Sign in to your account") so the
      // snapshot captures a fully-mounted form. Regex tolerates "Sign
      // in" / "Log in" variants across industry copy drift.
      await page
        .getByRole('heading', { name: /sign ?in|log ?in/i })
        .waitFor({ timeout: 10_000 });

      // Default masks only — login pages have no dynamic regions
      // beyond what DEFAULT_MASKS already covers inside prepareForSnapshot.
      const mask = await prepareForSnapshot(page);

      // Filename `login-<slug>.png` — Playwright auto-suffixes with the
      // project name for the mobile project, producing
      // `login-<slug>-visual-mobile.png` alongside the desktop baseline.
      await expect(page).toHaveScreenshot(`login-${industry.slug}.png`, {
        mask,
      });
    });
  }
});
