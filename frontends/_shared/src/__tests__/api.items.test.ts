// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, configureApi } from '../utils/api';

/**
 * Test surface for Slice 20 A2 — typed api.items.* + api.boards.create.
 *
 * Strategy: mock globalThis.fetch and assert the request shape (method,
 * URL, body, headers) the client produces. The actual backend is covered
 * by separate jest suites + the Phase D Playwright specs; here we prove
 * only the client contract.
 *
 * Reads per-test feel repetitive — that's DAMP-over-DRY. Each test should
 * be understandable in isolation without chasing a shared builder.
 */

// Token key must match configureApi default (`crm_access_token`).
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

function readBody(init: RequestInit): Record<string, unknown> {
  return init.body ? JSON.parse(init.body as string) : {};
}

function readHeader(init: RequestInit, name: string): string | undefined {
  const headers = init.headers as Record<string, string> | undefined;
  return headers?.[name];
}

describe('api.items.* and api.boards.create', () => {
  beforeEach(() => {
    // Reset base-URL config each test so configureApi() overrides don't
    // leak across cases.
    configureApi({ baseUrl: '/api/v1', tokenKey: 'crm_access_token' });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('api.items.create', () => {
    it('POSTs to /items with { boardId, groupId, name, values } body', async () => {
      const calls = stubFetch({ success: true, data: { item: { id: 42 } } }, 201);

      const result = await api.items.create({
        boardId: 7,
        groupId: 3,
        name: 'Deal with Acme',
        values: { 10: 'New', 11: 250 },
      });

      expect(result.success).toBe(true);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe('/api/v1/items');
      expect(calls[0].init.method).toBe('POST');
      expect(readBody(calls[0].init)).toEqual({
        boardId: 7,
        groupId: 3,
        name: 'Deal with Acme',
        values: { 10: 'New', 11: 250 },
      });
    });

    it('sends application/json Content-Type', async () => {
      const calls = stubFetch({ success: true, data: { item: { id: 1 } } });
      await api.items.create({ boardId: 1, groupId: 1, name: 'X' });
      expect(readHeader(calls[0].init, 'Content-Type')).toBe('application/json');
    });

    it('attaches Authorization: Bearer <token> when a token is stored', async () => {
      localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
      const calls = stubFetch({ success: true, data: { item: { id: 1 } } });
      await api.items.create({ boardId: 1, groupId: 1, name: 'X' });
      expect(readHeader(calls[0].init, 'Authorization')).toBe(`Bearer ${TEST_TOKEN}`);
    });

    it('returns { success: false, error } on network failure — never throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new TypeError('Failed to fetch');
        })
      );
      const result = await api.items.create({ boardId: 1, groupId: 1, name: 'X' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch');
    });
  });

  describe('api.items.update', () => {
    it('PUTs to /items/:id with the partial update body', async () => {
      const calls = stubFetch({ success: true, data: { item: { id: 42 } } });

      await api.items.update(42, { name: 'Renamed', position: 3 });

      expect(calls[0].url).toBe('/api/v1/items/42');
      expect(calls[0].init.method).toBe('PUT');
      expect(readBody(calls[0].init)).toEqual({ name: 'Renamed', position: 3 });
    });
  });

  describe('api.items.updateValues', () => {
    it('PUTs to /items/:id/values with { values: [...] } wrapping', async () => {
      const calls = stubFetch({ success: true, data: { values: [] } });

      await api.items.updateValues(42, [
        { columnId: 10, value: { label: 'Settled', color: '#34D399' } },
        { columnId: 11, value: 250 },
      ]);

      expect(calls[0].url).toBe('/api/v1/items/42/values');
      expect(calls[0].init.method).toBe('PUT');
      expect(readBody(calls[0].init)).toEqual({
        values: [
          { columnId: 10, value: { label: 'Settled', color: '#34D399' } },
          { columnId: 11, value: 250 },
        ],
      });
    });
  });

  describe('api.items.delete', () => {
    it('DELETEs to /items/:id with no body', async () => {
      const calls = stubFetch({ success: true });

      await api.items.delete(42);

      expect(calls[0].url).toBe('/api/v1/items/42');
      expect(calls[0].init.method).toBe('DELETE');
      expect(calls[0].init.body).toBeUndefined();
    });
  });

  describe('api.boards.create', () => {
    it('POSTs to /boards with the full board payload', async () => {
      const calls = stubFetch({ success: true, data: { board: { id: 5 } } }, 201);

      await api.boards.create({
        name: 'Deals Pipeline',
        description: 'Q2 2026 pipeline',
        workspaceId: 1,
        boardType: 'main',
      });

      expect(calls[0].url).toBe('/api/v1/boards');
      expect(calls[0].init.method).toBe('POST');
      expect(readBody(calls[0].init)).toEqual({
        name: 'Deals Pipeline',
        description: 'Q2 2026 pipeline',
        workspaceId: 1,
        boardType: 'main',
      });
    });

    it('allows omitting optional description', async () => {
      const calls = stubFetch({ success: true, data: { board: { id: 5 } } });

      await api.boards.create({
        name: 'Quick Board',
        workspaceId: 1,
        boardType: 'main',
      });

      expect(readBody(calls[0].init).description).toBeUndefined();
    });
  });

  describe('configureApi respects baseUrl override', () => {
    it('uses configured baseUrl when building URLs', async () => {
      configureApi({ baseUrl: 'https://api.example.com/v2' });
      const calls = stubFetch({ success: true, data: { item: { id: 1 } } });

      await api.items.create({ boardId: 1, groupId: 1, name: 'X' });

      expect(calls[0].url).toBe('https://api.example.com/v2/items');
    });
  });
});
