/**
 * Shared Artillery fixtures / payload helpers — Slice 19C D2.
 *
 * These helpers are referenced by the scenario YAMLs via the Artillery
 * `processor:` directive (pointing at dist/lib/fixtures.js after build).
 *
 * Everything here must be side-effect-free at import time — Artillery loads
 * the processor module once per worker, and we don't want auth calls or
 * 5 MiB allocations to happen before the test actually starts.
 */

import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';

// ---------------------------------------------------------------------------
// generate5MbPayload — deterministic 5 MiB Buffer (memoized on first call)
// ---------------------------------------------------------------------------

/** Exact payload size for Scenario (d). 5 MiB, matching SPEC §19C. */
const FIVE_MIB_BYTES = 5 * 1024 * 1024;

/**
 * Byte used to fill the payload. 0x42 ('B') is arbitrary but deliberately
 * non-zero so the payload doesn't compress away in transit — we want a
 * realistic 5 MiB on the wire, not a zero page the kernel can optimise out.
 */
const FILL_BYTE = 0x42;

let cached5MbPayload: Buffer | undefined;

/**
 * Returns a deterministic 5 MiB (5_242_880 bytes) Buffer suitable for file
 * upload scenarios. The buffer is allocated once and reused across calls —
 * subsequent invocations return the *same* Buffer reference, so repeated
 * calls are free.
 *
 * Callers that need to mutate the buffer must copy it first.
 */
export function generate5MbPayload(): Buffer {
  if (!cached5MbPayload) {
    cached5MbPayload = Buffer.alloc(FIVE_MIB_BYTES, FILL_BYTE);
  }
  return cached5MbPayload;
}

// ---------------------------------------------------------------------------
// pickRandomBoard — seeded PRNG for per-VU board selection
// ---------------------------------------------------------------------------

/**
 * xmur3 string hasher → 32-bit seed. We accept a numeric seed as input and
 * pass through xmur3 so adjacent seeds (1, 2, 3, ...) produce well-mixed
 * initial states for mulberry32.
 *
 * See: https://stackoverflow.com/a/47593316 (public-domain PRNG recipes).
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function (): number {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32 — tiny, fast, seedable PRNG. Returns a float in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically picks an integer index in `[0, boardCount)` given a
 * numeric seed. The same (seed, boardCount) pair always returns the same
 * index — this is how each virtual user "pins" to a specific seeded board
 * across scenario runs so cache-warmth behaviour is reproducible.
 */
export function pickRandomBoard(seed: number, boardCount: number): number {
  if (!Number.isInteger(boardCount) || boardCount <= 0) {
    throw new Error(`pickRandomBoard: boardCount must be a positive integer, got ${boardCount}`);
  }
  const hashed = xmur3(String(seed))();
  const rand = mulberry32(hashed)();
  return Math.floor(rand * boardCount);
}

// ---------------------------------------------------------------------------
// getAuthToken — cached POST /api/v1/auth/login helper
// ---------------------------------------------------------------------------

interface LoginResponse {
  // The real backend wraps payloads as { success, data: { accessToken, ... } }.
  // Defensively tolerate a flat shape too — future-proofs against minor
  // route tweaks without silently breaking the perf suite.
  success?: boolean;
  data?: { accessToken?: string };
  accessToken?: string;
}

/** Cache keyed by `${backendUrl}|${email}` so multiple users can coexist. */
const tokenCache = new Map<string, string>();

function postJson(targetUrl: string, body: unknown): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const payload = Buffer.from(JSON.stringify(body), 'utf8');
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          'content-type': 'application/json',
          'content-length': payload.length.toString(),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * POSTs `{ email, password }` to `${backendUrl}/api/v1/auth/login` and
 * returns the access token, caching the result per (backendUrl, email)
 * tuple so repeated calls from VUs don't hammer the login endpoint.
 *
 * Tolerates both the canonical `{ data: { accessToken } }` response shape
 * and a flat `{ accessToken }` fallback.
 */
export async function getAuthToken(
  backendUrl: string,
  email: string,
  password: string,
): Promise<string> {
  const key = `${backendUrl}|${email}`;
  const cached = tokenCache.get(key);
  if (cached) return cached;

  const normalised = backendUrl.replace(/\/+$/, '');
  const url = `${normalised}/api/v1/auth/login`;
  const { status, text } = await postJson(url, { email, password });
  if (status !== 200) {
    throw new Error(`getAuthToken: login failed with status ${status}: ${text.slice(0, 200)}`);
  }

  let parsed: LoginResponse;
  try {
    parsed = JSON.parse(text) as LoginResponse;
  } catch (err) {
    throw new Error(`getAuthToken: could not parse login response as JSON: ${(err as Error).message}`);
  }

  const token = parsed.data?.accessToken ?? parsed.accessToken;
  if (!token) {
    throw new Error('getAuthToken: response did not include an accessToken field');
  }

  tokenCache.set(key, token);
  return token;
}

// ---------------------------------------------------------------------------
// Artillery processor hooks
// ---------------------------------------------------------------------------

/**
 * Minimal structural type for Artillery's processor-hook context. Typing it
 * nominally would require pulling in @types for Artillery internals, which
 * is overkill for this slice.
 */
type ArtilleryContext = {
  vars: Record<string, unknown>;
};

type NextFn = (err?: Error) => void;

/**
 * Artillery hook: fetches + caches an access token and stashes it in the
 * scenario context as `{{ authToken }}`. Wire it up from YAML via e.g.:
 *
 *   scenarios:
 *     - beforeScenario: "setAuthToken"
 *
 * Env vars honoured:
 *   PERF_BACKEND_URL  (default http://backend:13000)
 *   PERF_USER_EMAIL   (default admin@crm-platform.com)
 *   PERF_USER_PASSWORD (default admin)
 */
export async function setAuthToken(context: ArtilleryContext, _events: unknown, next: NextFn): Promise<void> {
  try {
    const backendUrl = process.env.PERF_BACKEND_URL ?? 'http://backend:13000';
    const email = process.env.PERF_USER_EMAIL ?? 'admin@crm-platform.com';
    const password = process.env.PERF_USER_PASSWORD ?? 'admin';
    const token = await getAuthToken(backendUrl, email, password);
    context.vars.authToken = token;
    next();
  } catch (err) {
    next(err as Error);
  }
}

// Artillery's processor loader uses CommonJS `require`, so export the hooks
// as named members of the module.exports object (the TS `export function`
// above already does this under `"module": "commonjs"`). No default export
// needed — Artillery resolves hooks by name.
