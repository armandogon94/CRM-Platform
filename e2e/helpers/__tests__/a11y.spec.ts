import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { a11yScan, loadBaseline, __resetBaselineCache } from '../a11y';

/**
 * Unit tests for the a11y helper (Slice 19 E1).
 *
 * These tests exercise the helper directly — they do NOT go through
 * the Playwright fixture — so we can prove:
 *   1. Known-violating markup produces a serious/critical violation.
 *   2. A matching baseline entry suppresses that violation.
 *   3. A baseline entry missing a required field throws a clear error.
 *
 * We use `@playwright/test` rather than the shared fixture because
 * these tests bypass the fixture's assertion layer deliberately.
 */

// A button with no accessible name triggers axe's `button-name` rule
// (impact: serious). Rendered via page.setContent so no server is
// required.
const VIOLATING_HTML = `<!doctype html>
<html lang="en">
  <head><title>a11y helper test</title></head>
  <body>
    <button id="nameless"></button>
  </body>
</html>`;

function writeTempBaseline(entries: unknown): string {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-baseline-')),
    'baseline.json',
  );
  fs.writeFileSync(file, JSON.stringify(entries), 'utf8');
  return file;
}

test.describe('a11y helper', () => {
  test.beforeEach(() => {
    __resetBaselineCache();
  });

  test('detects serious/critical violations on known-bad markup', async ({ page }) => {
    const emptyBaseline = writeTempBaseline([]);
    await page.setContent(VIOLATING_HTML);

    const violations = await a11yScan(page, { baselinePath: emptyBaseline });

    expect(violations.length).toBeGreaterThan(0);
    const nameless = violations.find((v) => v.rule === 'button-name');
    expect(nameless).toBeDefined();
    expect(nameless && ['serious', 'critical']).toContain(nameless?.impact);
  });

  test('baseline entries suppress matching violations', async ({ page }) => {
    await page.setContent(VIOLATING_HTML);

    // First scan with an empty baseline to learn the exact selector
    // axe produces for the offending node — we suppress by that exact
    // string, not by guess.
    const emptyBaseline = writeTempBaseline([]);
    const unsuppressed = await a11yScan(page, { baselinePath: emptyBaseline });
    const target = unsuppressed.find((v) => v.rule === 'button-name');
    expect(target, 'expected button-name violation on VIOLATING_HTML').toBeDefined();

    __resetBaselineCache();
    const suppressingBaseline = writeTempBaseline([
      {
        rule: 'button-name',
        selector: target!.selector,
        justification: 'Test fixture — deliberately violating markup used to prove suppression.',
        reviewedOn: '2026-04-22',
      },
    ]);

    const suppressed = await a11yScan(page, { baselinePath: suppressingBaseline });
    const stillFiring = suppressed.find(
      (v) => v.rule === 'button-name' && v.selector === target!.selector,
    );
    expect(stillFiring).toBeUndefined();
  });

  test('loadBaseline throws a clear error when justification is missing', () => {
    const bad = writeTempBaseline([
      {
        rule: 'button-name',
        selector: '#nameless',
        // justification omitted on purpose
        reviewedOn: '2026-04-22',
      },
    ]);

    expect(() => loadBaseline(bad)).toThrow(/justification/);
  });

  test('loadBaseline accepts an empty array as the valid starting state', () => {
    const empty = writeTempBaseline([]);
    expect(loadBaseline(empty)).toEqual([]);
  });
});
