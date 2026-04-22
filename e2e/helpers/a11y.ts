import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Accessibility scan helper (Slice 19 E1).
 *
 * Runs axe-core against the current Playwright page, narrows the
 * results to violations of `serious` or `critical` impact, and filters
 * out any `{ rule, selector }` pairs that are explicitly accepted in
 * `e2e/a11y-baseline.json`. Each baseline entry MUST carry a written
 * justification and a review date — the loader enforces this contract
 * so we never accumulate silent exemptions.
 *
 * Ruleset: WCAG 2.1 AA — tags `wcag2a`, `wcag2aa`, `wcag21a`,
 * `wcag21aa`. This mirrors SPEC §Slice 19 Accessibility audit.
 *
 * The helper is deliberately pure (page → filtered violations). The
 * Playwright fixture in `fixtures/test.ts` wraps it with `expect(...)`
 * assertions so specs just call `await a11yScan()` and fail fast on
 * any un-justified violation.
 */

export interface BaselineEntry {
  /** The axe-core rule id (e.g. `button-name`, `color-contrast`). */
  rule: string;
  /** First target selector from the violating node. Exact string match. */
  selector: string;
  /** Human-readable reason why this violation is acceptable. */
  justification: string;
  /** ISO date (YYYY-MM-DD) indicating when the entry was last reviewed. */
  reviewedOn: string;
}

/** A single filtered violation — rule + one offending node selector. */
export interface FilteredViolation {
  rule: string;
  impact: 'serious' | 'critical';
  selector: string;
  help: string;
  helpUrl: string;
}

export interface A11yScanOptions {
  /**
   * Override path for the baseline file. Primarily used by the helper's
   * own unit tests to exercise validation and suppression logic.
   * Callers in spec files should omit this — the default points at
   * `e2e/a11y-baseline.json` resolved from this file's location.
   */
  baselinePath?: string;
}

const DEFAULT_BASELINE_PATH = path.resolve(__dirname, '../a11y-baseline.json');

/** Per-path memo so the JSON file is parsed at most once per process. */
const baselineCache = new Map<string, BaselineEntry[]>();

/**
 * Loads and validates the baseline file at `filePath`. Memoised per
 * path. An empty array is valid (the only legitimate starting state);
 * any entry missing one of the four required fields triggers a clear
 * error that names the offending index so it's easy to fix.
 */
export function loadBaseline(filePath: string = DEFAULT_BASELINE_PATH): BaselineEntry[] {
  const cached = baselineCache.get(filePath);
  if (cached) {
    return cached;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `a11y-baseline: failed to parse JSON at ${filePath}: ${(err as Error).message}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `a11y-baseline: ${filePath} must contain a JSON array (empty [] is valid).`,
    );
  }

  const required: Array<keyof BaselineEntry> = ['rule', 'selector', 'justification', 'reviewedOn'];
  const entries: BaselineEntry[] = parsed.map((entry, index) => {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(
        `a11y-baseline: entry at index ${index} must be an object, got ${typeof entry}.`,
      );
    }
    const record = entry as Record<string, unknown>;
    for (const field of required) {
      const value = record[field];
      if (typeof value !== 'string' || value.length === 0) {
        throw new Error(
          `a11y-baseline: entry at index ${index} is missing required field "${field}" ` +
            `(all of ${required.join(', ')} are required and must be non-empty strings).`,
        );
      }
    }
    return {
      rule: record.rule as string,
      selector: record.selector as string,
      justification: record.justification as string,
      reviewedOn: record.reviewedOn as string,
    };
  });

  baselineCache.set(filePath, entries);
  return entries;
}

/** Clears the memoised baseline. Exposed for tests only. */
export function __resetBaselineCache(): void {
  baselineCache.clear();
}

/**
 * Runs axe-core against `page` scoped to WCAG 2.1 AA tags, narrows to
 * serious/critical violations, and returns a flat list with each
 * offending node expanded to its first-target selector so callers (and
 * the baseline file) can reference a stable `{ rule, selector }` pair.
 */
export async function a11yScan(
  page: Page,
  options: A11yScanOptions = {},
): Promise<FilteredViolation[]> {
  const baseline = loadBaseline(options.baselinePath);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const filtered: FilteredViolation[] = [];
  for (const violation of results.violations) {
    if (violation.impact !== 'serious' && violation.impact !== 'critical') {
      continue;
    }
    for (const node of violation.nodes) {
      // axe's `target` is `UnlabelledFrameSelector` — an array whose
      // first entry is the CSS selector in the top frame. That's the
      // most stable reference for a baseline entry.
      const selector = normalizeSelector(node.target);
      if (isSuppressed(baseline, violation.id, selector)) {
        continue;
      }
      filtered.push({
        rule: violation.id,
        impact: violation.impact,
        selector,
        help: violation.help,
        helpUrl: violation.helpUrl,
      });
    }
  }
  return filtered;
}

function normalizeSelector(target: unknown): string {
  if (Array.isArray(target) && target.length > 0) {
    const first = target[0];
    return typeof first === 'string' ? first : JSON.stringify(first);
  }
  return typeof target === 'string' ? target : JSON.stringify(target);
}

function isSuppressed(baseline: BaselineEntry[], rule: string, selector: string): boolean {
  return baseline.some((entry) => entry.rule === rule && entry.selector === selector);
}
