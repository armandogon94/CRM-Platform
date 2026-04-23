import { test, expect } from '@playwright/test';
import { DEFAULT_MASKS, prepareForSnapshot } from '../visual';

/**
 * Unit tests for the prepareForSnapshot helper (Slice 19B B1).
 *
 * Uses `page.setContent()` with a handcrafted HTML fixture — no backend
 * or app required — so these run under the `helpers` project (already
 * wired by the Slice 19 E1 review-fix).
 *
 * The tests don't take a real screenshot: that's D1+'s job. Here we
 * prove the helper contract (animation kill, mask counting, extras
 * merging) so every downstream spec can trust it.
 */

const ANIMATED_FIXTURE = `
<!doctype html>
<html>
  <head>
    <style>
      @keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
      .spinner { animation: spin 2s linear infinite; display: inline-block; }
    </style>
  </head>
  <body>
    <h1>Fixture</h1>
    <span class="spinner" id="spinner">spinner</span>
    <time data-testid="timestamp">2026-01-01T00:00:00Z</time>
    <span class="avatar-fallback" style="background: #abcdef">A</span>
  </body>
</html>
`;

test.describe('prepareForSnapshot', () => {
  test('disables animation via !important CSS injection', async ({ page }) => {
    await page.setContent(ANIMATED_FIXTURE);
    await prepareForSnapshot(page);

    const animationName = await page.evaluate(() => {
      const el = document.getElementById('spinner');
      return el ? getComputedStyle(el).animationName : null;
    });
    // Our injected rule sets `animation: none !important` → computed
    // `animation-name` resolves to `none`.
    expect(animationName).toBe('none');
  });

  test('returns one Locator per default mask selector when no extras passed', async ({ page }) => {
    await page.setContent(ANIMATED_FIXTURE);
    const masks = await prepareForSnapshot(page);

    expect(masks).toHaveLength(DEFAULT_MASKS.length);
  });

  test('merges extraMasks with defaults and dedupes duplicates', async ({ page }) => {
    await page.setContent(ANIMATED_FIXTURE);
    const masks = await prepareForSnapshot(page, {
      extraMasks: [
        '.custom-dynamic', // new selector
        DEFAULT_MASKS[0],  // duplicate of an existing default — must not double-count
      ],
    });

    expect(masks).toHaveLength(DEFAULT_MASKS.length + 1);
  });

  test('awaits document.fonts.ready (promise resolves without throwing)', async ({ page }) => {
    await page.setContent('<!doctype html><html><body><p>no fonts</p></body></html>');
    // If fonts.ready never resolves, prepareForSnapshot would time out
    // via its race against fontReadyTimeoutMs. A tight timeout proves
    // the happy path completes well under it.
    await expect(
      prepareForSnapshot(page, { fontReadyTimeoutMs: 2_000 }),
    ).resolves.toBeDefined();
  });
});
