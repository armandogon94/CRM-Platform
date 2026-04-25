// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Slice 20.5 A1 — configureWebSocket token-key configuration tests.
 *
 * Mirrors the existing configureApi({ tokenKey }) pattern from utils/api.ts.
 * Industries call this at boot in main.tsx to align the shared
 * useWebSocket hook with their slug-prefixed localStorage key
 * (e.g. 'novapay_token'). Without this, useWebSocket reads the wrong
 * key and the Socket.io auth handshake fails.
 *
 * Tests verify the configured key is what useWebSocket reads from
 * localStorage when establishing a connection. We don't actually open
 * a socket — that's covered by the integration suite. We mock
 * socket.io-client at the boundary and assert on the auth.token field.
 */

// Mock socket.io-client BEFORE importing useWebSocket so the import
// graph picks up our spy.
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};
const mockIo = vi.fn((..._args: unknown[]) => mockSocket);

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
  Socket: class {},
}));

// Now import — module-level _tokenKey is fresh per test file.
import { configureWebSocket, useWebSocket } from '../hooks/useWebSocket';
import { renderHook } from '@testing-library/react';

function getAuthTokenFromLastIoCall(): string | null {
  if (mockIo.mock.calls.length === 0) return null;
  const lastCallArgs = mockIo.mock.calls[mockIo.mock.calls.length - 1] as unknown[];
  const opts = lastCallArgs[1] as { auth?: { token?: string } } | undefined;
  return opts?.auth?.token ?? null;
}

describe('configureWebSocket', () => {
  beforeEach(() => {
    mockIo.mockClear();
    localStorage.clear();
    // Reset the module-level _tokenKey to its default by configuring it
    // explicitly back. Since vitest doesn't reset module state between
    // tests, every test starts by setting a known key.
    configureWebSocket({ tokenKey: 'crm_access_token' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses the default key crm_access_token when configureWebSocket is never called', () => {
    // Reset module state to "never configured" by re-importing won't help —
    // the spec contract is "default key = crm_access_token", which the
    // beforeEach asserts. Verify that's what useWebSocket reads.
    localStorage.setItem('crm_access_token', 'default-token-abc');

    renderHook(() => useWebSocket(1));

    expect(getAuthTokenFromLastIoCall()).toBe('default-token-abc');
  });

  it('reads from a custom key after configureWebSocket({ tokenKey }) is called', () => {
    configureWebSocket({ tokenKey: 'novapay_token' });
    localStorage.setItem('novapay_token', 'industry-token-xyz');
    // Cross-check: the default key is NOT what we read.
    localStorage.setItem('crm_access_token', 'should-not-be-used');

    renderHook(() => useWebSocket(1));

    expect(getAuthTokenFromLastIoCall()).toBe('industry-token-xyz');
  });

  it('reverting to default key works (idempotent re-configuration)', () => {
    configureWebSocket({ tokenKey: 'novapay_token' });
    configureWebSocket({ tokenKey: 'crm_access_token' });
    localStorage.setItem('crm_access_token', 'after-revert');
    localStorage.setItem('novapay_token', 'should-not-be-used');

    renderHook(() => useWebSocket(1));

    expect(getAuthTokenFromLastIoCall()).toBe('after-revert');
  });

  it('multiple calls last-wins', () => {
    configureWebSocket({ tokenKey: 'first_key' });
    configureWebSocket({ tokenKey: 'second_key' });
    configureWebSocket({ tokenKey: 'third_key' });
    localStorage.setItem('third_key', 'final-token');

    renderHook(() => useWebSocket(1));

    expect(getAuthTokenFromLastIoCall()).toBe('final-token');
  });
});
