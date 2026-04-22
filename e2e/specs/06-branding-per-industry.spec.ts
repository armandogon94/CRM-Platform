import { test, expect } from '../fixtures/test';
import { INDUSTRY_THEMES } from '../../frontends/_shared/src/theme';

/**
 * Slice 19 — Flow 6: Per-industry branding smoke test.
 *
 * Asserts each of the 10 industry frontends renders its own primary
 * brand colour on the login page's "Sign In" submit button. The button
 * is the authoritative assertion target because `LoginPage.tsx` applies
 * `style={{ backgroundColor: primaryColor }}` directly to it — the
 * theme primary hex is round-tripped through the DOM with no further
 * transformation, so a computed-style read gives us an exact-match
 * signal with no tolerance fudging.
 *
 * Why the login page (not an authenticated view)?
 *   Only NovaPay has an e2e fixture user seeded (Task B1). The other 9
 *   industries do not, so we cannot pre-authenticate into them. The
 *   login page is ALREADY fully themed via props wired in each
 *   industry's app entry, which lets Flow 6 exercise its promise —
 *   "each industry renders its own brand colour" — WITHOUT touching
 *   auth.setup.ts, fixtures/test.ts, or seeding 9 extra users.
 *
 * Why `storageState: undefined` at the describe level?
 *   The three main projects in playwright.config.ts wire
 *   `storageState: '.auth/novapay.json'` so authenticated specs pick
 *   up the e2e user automatically. This spec runs PRE-auth, so we
 *   explicitly drop that state to guarantee a clean, cookieless
 *   context that lands on /login. The `desktop-branding-all` project
 *   is also configured with `dependencies: []` (no setup dep) and no
 *   storageState of its own — this inline override is belt-and-
 *   braces.
 *
 * Determinism:
 *   - Role-based selectors only (getByRole).
 *   - One page.evaluate per test, reading `getComputedStyle(...).backgroundColor`.
 *   - `rgb(…)` / `rgba(…)` normalised to lowercase `#rrggbb` before comparison.
 *   - Tests run in parallel across all 10 industries (test.describe.parallel).
 */

// Ports 13001-13010 map 1:1 to the industry slugs in INDUSTRY_THEMES.
// Kept local to this spec — the mapping isn't needed elsewhere yet, and
// co-locating it with the only consumer keeps the source of truth close
// to the assertions that depend on it.
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
  primaryColor: string;
}

const INDUSTRIES: IndustryCase[] = Object.entries(INDUSTRY_THEMES).map(
  ([slug, theme]) => ({
    slug,
    port: INDUSTRY_PORTS[slug],
    companyName: theme.companyName,
    primaryColor: theme.primaryColor.toLowerCase(),
  })
);

/**
 * Normalises a CSS colour value returned by `getComputedStyle` to
 * lowercase `#rrggbb`. Browsers return resolved colours as
 * `rgb(r, g, b)` or `rgba(r, g, b, a)` regardless of the input format
 * (hex, named, etc.), so this handler covers every realistic case.
 *
 * Keeping the helper in-spec (rather than in e2e/helpers/) because it
 * has exactly one caller and leaking it to a shared module would
 * invite accidental reuse in contexts where alpha handling matters.
 */
function normaliseToHex(cssColor: string): string {
  const match = cssColor.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/
  );
  if (match) {
    const [, r, g, b] = match;
    const toHex = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  }
  // Pass-through for values already in #rrggbb form (unlikely from
  // getComputedStyle but cheap insurance).
  if (/^#[0-9a-f]{6}$/i.test(cssColor)) {
    return cssColor.toLowerCase();
  }
  throw new Error(`Unrecognised CSS colour format: ${cssColor}`);
}

test.describe.parallel('Flow 6 — branding smoke', () => {
  // Drop any inherited storage state so each industry gets a fresh,
  // unauthenticated context. The project-level baseURL points at
  // NovaPay (13001); each test navigates to its own absolute URL
  // instead of relying on baseURL so industries 2-10 work too.
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const industry of INDUSTRIES) {
    test(`${industry.companyName} login page renders its brand colour`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:${industry.port}/login`);

      const submitButton = page.getByRole('button', {
        name: /sign ?in/i,
      });
      await expect(submitButton).toBeVisible();

      // The `evaluate` callback runs in the browser, where `window` and
      // `getComputedStyle` are present — but this spec is type-checked
      // by a Node-only tsconfig (lib: ES2022, no DOM). Cast through
      // `unknown` to reach the browser-only API without widening the
      // project's lib surface just for this one call site.
      const rawBackground: string = await submitButton.evaluate((el) => {
        const g = globalThis as unknown as {
          getComputedStyle(e: unknown): { backgroundColor: string };
        };
        return g.getComputedStyle(el).backgroundColor;
      });
      const actual = normaliseToHex(rawBackground);

      expect(
        actual,
        `${industry.companyName} (slug=${industry.slug}, port=${industry.port}) ` +
          `rendered ${actual}, expected ${industry.primaryColor}`
      ).toBe(industry.primaryColor);
    });
  }
});
