// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, configureApi } from '../utils/api';

/**
 * Test surface for Slice 21B B1 — api.workspaces.searchMembers typed
 * method + AbortController integration.
 *
 * Strategy: mock globalThis.fetch and assert the request shape (URL,
 * method, headers, signal) the client produces. Backend behavior is
 * covered by jest in backend/src/__tests__/routes/workspaces.test.ts;
 * here we prove only the client contract.
 *
 * Per plan B1 + plans/slice-21b-plan.md "Open question 3" — we add
 * AbortController plumbing so debounced consumers can cancel stale
 * in-flight requests. fetch() supports this natively via init.signal.
 *
 * Reads per-test feel repetitive — that's DAMP-over-DRY. Each test should
 * be understandable in isolation without chasing a shared builder.
 */

const TOKEN_KEY = 'crm_access_token';
const TEST_TOKEN = 'test-jwt-token';

type FetchCall = {
  url: string;
  init: RequestInit;
};

function stubFetch(response: unknown, status = 200): FetchCall[] {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init: init ?? {} });
      return {
        status,
        json: async () => response,
      } as Response;
    })
  );
  return calls;
}

function readHeader(init: RequestInit, name: string): string | undefined {
  const headers = init.headers as Record<string, string> | undefined;
  return headers?.[name];
}

describe('api.workspaces.searchMembers (Slice 21B B1)', () => {
  beforeEach(() => {
    configureApi({ baseUrl: '/api/v1', tokenKey: 'crm_access_token' });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs /workspaces/:id/members with empty search and Bearer auth header', async () => {
    localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
    const calls = stubFetch({
      success: true,
      data: { members: [] },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });

    const result = await api.workspaces.searchMembers(7, '');

    expect(result.success).toBe(true);
    expect(calls).toHaveLength(1);
    // Empty search must NOT add a `search=` param — backend hits the
    // recents-50 path when the query is absent.
    expect(calls[0].url).toBe('/api/v1/workspaces/7/members');
    expect(calls[0].init.method).toBe('GET');
    expect(readHeader(calls[0].init, 'Authorization')).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('appends ?search=alice when a search term is provided', async () => {
    localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
    const calls = stubFetch({
      success: true,
      data: { members: [] },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });

    await api.workspaces.searchMembers(7, 'alice');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/v1/workspaces/7/members?search=alice');
    expect(calls[0].init.method).toBe('GET');
  });

  it('passes options.signal to fetch so callers can abort in-flight requests', async () => {
    const calls = stubFetch({
      success: true,
      data: { members: [] },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });

    const controller = new AbortController();
    await api.workspaces.searchMembers(7, 'a', {
      limit: 20,
      signal: controller.signal,
    });

    expect(calls).toHaveLength(1);
    // limit=20 must be added to the URL alongside search=a.
    expect(calls[0].url).toBe('/api/v1/workspaces/7/members?search=a&limit=20');
    // The signal must be threaded through to fetch's init so that
    // controller.abort() cancels the in-flight request.
    expect(calls[0].init.signal).toBe(controller.signal);
  });

  it('returns { success: false } when the request is aborted (graceful AbortError)', async () => {
    // Real fetch throws DOMException('AbortError') when init.signal is
    // already aborted. Stub fetch to mimic that behavior.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('The operation was aborted.');
        err.name = 'AbortError';
        throw err;
      })
    );

    const controller = new AbortController();
    controller.abort();

    const result = await api.workspaces.searchMembers(7, 'a', {
      signal: controller.signal,
    });

    // The existing `request<T>` error contract returns the envelope shape,
    // not a thrown error — debounced callers can ignore stale aborts
    // without try/catch boilerplate.
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
