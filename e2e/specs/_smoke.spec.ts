import { test, expect } from '@playwright/test';

/**
 * Temporary placeholder spec (Slice 19 C3) — removed in Task D1 when the
 * first real spec lands. Its only purpose is to give Playwright at least
 * one test to run so that globalSetup.ts actually fires and the
 * reset-before-suite contract is exercised.
 *
 * If this spec reaches its body without throwing, globalSetup already
 * succeeded — Playwright aborts the whole run if globalSetup rejects.
 */
test('globalSetup ran and fixture workspace was reset', () => {
  expect(true).toBe(true);
});
