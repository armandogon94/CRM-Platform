/**
 * Tests for lib/fixtures — Slice 19C D2.
 *
 * Uses Node's built-in test runner (`node:test`, available on Node 20+)
 * so we avoid pulling Jest/Mocha into the perf package.
 *
 * Run with: `node dist/lib/__tests__/fixtures.test.js`
 * (after `npm run build` compiles TS → JS under dist/).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generate5MbPayload, pickRandomBoard } from '../fixtures';

const FIVE_MIB = 5 * 1024 * 1024; // 5_242_880 bytes

test('generate5MbPayload returns a Buffer of exactly 5 MiB', () => {
  const buf = generate5MbPayload();
  assert.ok(Buffer.isBuffer(buf), 'expected a Buffer instance');
  assert.equal(buf.length, FIVE_MIB, `expected ${FIVE_MIB} bytes, got ${buf.length}`);
});

test('generate5MbPayload is deterministic across calls (byte-identical)', () => {
  const a = generate5MbPayload();
  const b = generate5MbPayload();
  // Identity check first (memoization): repeated calls should not re-allocate.
  assert.strictEqual(a, b, 'expected the memoized buffer to be referentially identical');
  // Byte-equality defence (belt-and-braces in case memoization is ever removed).
  assert.ok(a.equals(b), 'expected byte-identical buffers');
});

test('pickRandomBoard is deterministic: same seed + n returns same index', () => {
  const seed = 42;
  const n = 1000;
  const first = pickRandomBoard(seed, n);
  const second = pickRandomBoard(seed, n);
  assert.equal(first, second, `expected deterministic output, got ${first} vs ${second}`);
  assert.ok(Number.isInteger(first), 'expected integer index');
  assert.ok(first >= 0 && first < n, `expected index in [0, ${n}), got ${first}`);
});

test('pickRandomBoard differs for different seeds (sanity)', () => {
  // Not strictly required by the spec, but protects against the degenerate
  // case where the PRNG collapses to a constant.
  const samples = new Set<number>();
  for (let seed = 1; seed <= 50; seed++) {
    samples.add(pickRandomBoard(seed, 1000));
  }
  assert.ok(samples.size > 1, 'expected varying indices across 50 different seeds');
});
