// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, configureApi, uploadWithProgress } from '../utils/api';

/**
 * Test surface for Slice 21A A1 — uploadWithProgress XHR helper +
 * api.files.{upload, list, delete} typed methods.
 *
 * Per ADR 21A-1 (SPEC §Slice 21A): the upload path uses XMLHttpRequest
 * (not fetch) because fetch does not surface upload progress events;
 * XHR's `upload.onprogress` does. The list/delete paths stay on fetch
 * (no progress needed) and reuse the existing request<T> pattern.
 *
 * Strategy: vi.stubGlobal('XMLHttpRequest', mockXhr) for the upload tests
 * — manual mock exposes upload.onprogress + onload + onerror + status +
 * responseText, with helpers to simulate progress and load events. The
 * list/delete tests reuse the fetch-stub pattern from api.items.test.ts.
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

/**
 * Manual XMLHttpRequest mock. Tests grab the most recent instance via
 * `lastXhr()` and dispatch progress / load events directly on it. We
 * record the XHR's open/send/setRequestHeader calls so assertions can
 * verify the URL, method, body, and headers the helper produced.
 */
type XhrCall = {
  method: string;
  url: string;
  body: unknown;
  headers: Record<string, string>;
};

let xhrCalls: XhrCall[] = [];
let lastXhrInstance: MockXhr | null = null;

class MockXhr {
  upload: { onprogress: ((ev: { loaded: number; total: number }) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 0;
  responseText = '';
  private _method = '';
  private _url = '';
  private _headers: Record<string, string> = {};

  open(method: string, url: string) {
    this._method = method;
    this._url = url;
  }

  setRequestHeader(name: string, value: string) {
    this._headers[name] = value;
  }

  send(body: unknown) {
    xhrCalls.push({
      method: this._method,
      url: this._url,
      body,
      headers: { ...this._headers },
    });
    lastXhrInstance = this;
  }

  // Test-only helpers — not part of the real XHR API but exposed so tests
  // can simulate the browser dispatching progress/load events.
  _emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ loaded, total });
  }

  _emitLoad(status: number, responseText: string) {
    this.status = status;
    this.responseText = responseText;
    this.onload?.();
  }
}

function lastXhr(): MockXhr {
  if (!lastXhrInstance) throw new Error('no XHR instance recorded yet');
  return lastXhrInstance;
}

function stubXhr(): void {
  xhrCalls = [];
  lastXhrInstance = null;
  vi.stubGlobal('XMLHttpRequest', MockXhr);
}

describe('api.files.* (Slice 21A A1)', () => {
  beforeEach(() => {
    configureApi({ baseUrl: '/api/v1', tokenKey: 'crm_access_token' });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadWithProgress', () => {
    it('resolves with parsed JSON on 2xx and invokes onProgress with percent', async () => {
      stubXhr();
      localStorage.setItem(TOKEN_KEY, TEST_TOKEN);

      const fd = new FormData();
      fd.append('file', new Blob(['hello']), 'hello.txt');

      const onProgress = vi.fn();
      const promise = uploadWithProgress<{ ok: boolean }>(
        '/api/v1/files/upload',
        fd,
        onProgress
      );

      // Simulate the browser dispatching one progress event then load.
      lastXhr()._emitProgress(50, 100);
      lastXhr()._emitLoad(201, JSON.stringify({ ok: true }));

      await expect(promise).resolves.toEqual({ ok: true });
      expect(onProgress).toHaveBeenCalled();
      // Caller receives a percent (0–100), not raw bytes.
      expect(onProgress.mock.calls[0][0]).toBe(50);
    });

    it('rejects with { status, message } on 413 quota error', async () => {
      stubXhr();

      const fd = new FormData();
      fd.append('file', new Blob(['x']), 'x.txt');

      const promise = uploadWithProgress('/api/v1/files/upload', fd);
      lastXhr()._emitLoad(
        413,
        JSON.stringify({ success: false, error: 'Workspace storage quota exceeded' })
      );

      await expect(promise).rejects.toMatchObject({
        status: 413,
        message: 'Workspace storage quota exceeded',
      });
    });
  });

  describe('api.files.upload', () => {
    it('POSTs multipart with exactly file + itemId + columnValueId fields and Bearer auth', async () => {
      stubXhr();
      localStorage.setItem(TOKEN_KEY, TEST_TOKEN);

      const file = new File(['payload'], 'doc.pdf', { type: 'application/pdf' });
      const promise = api.files.upload(file, { itemId: 7, columnValueId: 11 });

      // Resolve so the promise doesn't hang the test.
      lastXhr()._emitLoad(
        201,
        JSON.stringify({ success: true, data: { file: { id: 1 } } })
      );
      await promise;

      expect(xhrCalls).toHaveLength(1);
      const call = xhrCalls[0];
      expect(call.method).toBe('POST');
      expect(call.url).toBe('/api/v1/files/upload');
      expect(call.headers['Authorization']).toBe(`Bearer ${TEST_TOKEN}`);

      // Body is FormData; assert the fields directly.
      const body = call.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('itemId')).toBe('7');
      expect(body.get('columnValueId')).toBe('11');
      expect(body.get('file')).toBeInstanceOf(File);
      expect((body.get('file') as File).name).toBe('doc.pdf');
    });

    it('omits columnValueId field when not provided', async () => {
      stubXhr();

      const file = new File(['payload'], 'doc.pdf', { type: 'application/pdf' });
      const promise = api.files.upload(file, { itemId: 7 });

      lastXhr()._emitLoad(201, JSON.stringify({ success: true, data: { file: { id: 1 } } }));
      await promise;

      const body = xhrCalls[0].body as FormData;
      expect(body.get('itemId')).toBe('7');
      expect(body.get('columnValueId')).toBeNull();
      expect(body.get('file')).toBeInstanceOf(File);
    });
  });

  describe('api.files.list', () => {
    it('GETs /files?itemId=N with Bearer auth header', async () => {
      localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
      const calls = stubFetch({ success: true, data: { files: [] } });

      const result = await api.files.list({ itemId: 42 });

      expect(result.success).toBe(true);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe('/api/v1/files?itemId=42');
      expect(calls[0].init.method).toBe('GET');
      expect(readHeader(calls[0].init, 'Authorization')).toBe(`Bearer ${TEST_TOKEN}`);
    });
  });

  describe('api.files.delete', () => {
    it('DELETEs /files/:id with no body and Bearer auth header', async () => {
      localStorage.setItem(TOKEN_KEY, TEST_TOKEN);
      const calls = stubFetch({ success: true });

      await api.files.delete(99);

      expect(calls[0].url).toBe('/api/v1/files/99');
      expect(calls[0].init.method).toBe('DELETE');
      expect(calls[0].init.body).toBeUndefined();
      expect(readHeader(calls[0].init, 'Authorization')).toBe(`Bearer ${TEST_TOKEN}`);
    });
  });
});
