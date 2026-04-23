import type { Locator, Page } from '@playwright/test';

/**
 * Visual regression helpers (Slice 19B B1).
 *
 * One call — `await prepareForSnapshot(page, { extraMasks })` — turns
 * any rendered Playwright page into a snapshot-ready state:
 *
 *   1. Waits for webfont loading via `document.fonts.ready` (deterministic
 *      typography — no flicker of fallback fonts during snapshot).
 *   2. Waits for `networkidle` so lazy-loaded images, avatars, and XHR
 *      payloads have all settled.
 *   3. Injects a CSS rule that disables animations, transitions, and
 *      blinking carets — the three usual suspects for non-deterministic
 *      frame-to-frame diffs on fast hardware.
 *   4. Returns the `Locator[]` for regions that carry inherently-dynamic
 *      content (timestamps, color-hash avatar fallbacks, notification
 *      counts). Callers forward this directly to
 *      `expect(page).toHaveScreenshot({ mask })`.
 *
 * `DEFAULT_MASKS` is the SPEC §Slice 19B "Mask dynamic regions" list
 * lifted into one named constant so updates land in exactly one place.
 * Per-spec overrides merge via `options.extraMasks` (additive, not
 * replacing, so nobody accidentally un-masks a default region).
 */

/**
 * Selectors targeted at stable `data-testid` attributes on regions whose
 * content is inherently runtime-variable. Listed in SPEC §Slice 19B.
 */
export const DEFAULT_MASKS: readonly string[] = [
  '[data-testid="timestamp"]',
  // Avatars that fall back to a deterministic-per-user but visually
  // arbitrary color hash when no profile image is set.
  '.avatar-fallback',
  // Notification badge count changes across runs.
  '[data-testid="notification-count"]',
];

export interface PrepareForSnapshotOptions {
  /**
   * Extra selectors to mask in addition to `DEFAULT_MASKS`. Use this for
   * per-spec dynamic regions (e.g. MapView's Leaflet attribution tile).
   */
  extraMasks?: readonly string[];
  /** Font-ready timeout; default 5 s. */
  fontReadyTimeoutMs?: number;
  /** Network-idle timeout; default 10 s. */
  networkIdleTimeoutMs?: number;
}

/**
 * Prepare `page` for a deterministic screenshot and return the locators
 * that the caller should pass as `{ mask: ... }` to `toHaveScreenshot`.
 *
 * Caller pattern:
 *   const mask = await prepareForSnapshot(page);
 *   await expect(page).toHaveScreenshot('login.png', { mask });
 */
export async function prepareForSnapshot(
  page: Page,
  options: PrepareForSnapshotOptions = {},
): Promise<Locator[]> {
  const {
    extraMasks = [],
    fontReadyTimeoutMs = 5_000,
    networkIdleTimeoutMs = 10_000,
  } = options;

  // 1. Webfonts — resolves as soon as the FontFaceSet settles.
  await Promise.race([
    page.evaluate(() => document.fonts.ready.then(() => undefined)),
    new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error('prepareForSnapshot: document.fonts.ready timed out')),
        fontReadyTimeoutMs,
      ),
    ),
  ]);

  // 2. Network idle — gives images + async data a chance to paint.
  await page.waitForLoadState('networkidle', { timeout: networkIdleTimeoutMs });

  // 3. Kill visual nondeterminism (animations, transitions, blinking
  // caret). `!important` beats any inline styles the app may apply.
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  });

  // 4. Build the mask locator list: defaults + extras, deduped. Order
  // matters only for human readability of failing-diff reports.
  const selectors = Array.from(new Set([...DEFAULT_MASKS, ...extraMasks]));
  return selectors.map((sel) => page.locator(sel));
}
