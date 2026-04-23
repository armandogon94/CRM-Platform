import type { FullConfig } from '@playwright/test';

/**
 * Playwright globalSetup (Slice 19 C3).
 *
 * Runs once before the whole test suite. Responsibilities:
 *   1. Acquire a JWT by logging in as the dev admin
 *      (admin@crm-platform.com / admin seeded in the main workspace —
 *      untouched by the reset).
 *   2. POST /api/v1/admin/e2e/reset with that JWT. The route only
 *      exists when the backend has NODE_ENV != 'production' AND
 *      E2E_RESET_ENABLED = 'true' (see Task A4). docker-compose.e2e.yml
 *      sets both.
 *   3. Retry transient failures (connection refused / 5xx / timeout)
 *      up to MAX_ATTEMPTS with BACKOFF_MS between tries. Fail fast
 *      otherwise so the suite does not run against a dirty fixture.
 *
 * Contract-stability note: the login endpoint wraps its payload in
 *   { success: true, data: { accessToken, refreshToken, user } }
 * (see backend/src/utils/response.ts). The reset endpoint returns
 *   { ok: true, workspaceId: number | null }
 * (see backend/src/routes/admin.e2e.ts). This module tolerates small
 * envelope changes by only inspecting `res.ok` and the fields it needs.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:13000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@crm-platform.com';
// No fallback — require the password via env so a silent password drift in
// the seed never surfaces as a confusing "login failed" 500 pages later.
// Local runs: export E2E_ADMIN_PASSWORD=admin  (the seeded dev password).
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = 2_000;

/**
 * Wraps fetch with an AbortController so a hung connection is bounded.
 * Returns the Response (no auto-throw on non-2xx — the caller decides).
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loginAsAdmin(): Promise<string> {
  if (!ADMIN_PASSWORD) {
    throw new Error(
      '[globalSetup] E2E_ADMIN_PASSWORD env var is required. ' +
        'Local runs: `export E2E_ADMIN_PASSWORD=admin` (the seeded dev password).'
    );
  }

  const res = await fetchWithTimeout(
    `${BACKEND_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `login failed for ${ADMIN_EMAIL}: ${res.status} ${res.statusText} ${text}`.trim()
    );
  }

  const body = (await res.json()) as {
    data?: { accessToken?: string };
    accessToken?: string;
  };
  const token = body.data?.accessToken ?? body.accessToken;
  if (!token) {
    throw new Error('login response missing accessToken');
  }
  return token;
}

async function callReset(token: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${BACKEND_URL}/api/v1/admin/e2e/reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `reset endpoint rejected: ${res.status} ${res.statusText} ${text}`.trim()
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Login + reset with bounded retry. Exported so unit tests (and the D1+
 * specs, if they ever need a mid-suite reset) can exercise the same
 * logic without going through Playwright's globalSetup hook.
 */
export async function runReset(): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const token = await loginAsAdmin();
      await callReset(token);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_ATTEMPTS) {
        // eslint-disable-next-line no-console
        console.warn(
          `[globalSetup] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastError.message}; retrying in ${BACKOFF_MS}ms`
        );
        await sleep(BACKOFF_MS);
      }
    }
  }

  throw new Error(
    `[globalSetup] reset failed after ${MAX_ATTEMPTS} attempts; last error: ${lastError?.message ?? 'unknown'}`
  );
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await runReset();
}
