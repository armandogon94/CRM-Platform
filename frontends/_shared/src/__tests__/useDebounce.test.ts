// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

/**
 * Test surface for Slice 21B B2 — useDebounce<T>(value, delayMs): T.
 *
 * Behavior contract (per SPEC §Slice 21B + plans/slice-21b-plan.md):
 * - First render returns the input value with no delay.
 * - Rapid input changes within delayMs produce only one trailing emission
 *   (last-wins).
 * - Unmount cancels the pending timer (no setState after unmount).
 *
 * Strategy: vi.useFakeTimers() so we can advance time deterministically;
 * @testing-library/react's renderHook wraps state updates in act() for us.
 *
 * Reads per-test feel repetitive — that's DAMP-over-DRY. Each test should
 * be understandable in isolation without chasing a shared builder.
 */

describe('useDebounce (Slice 21B B2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the initial value synchronously on first render', () => {
    const { result } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'hello' },
    });

    expect(result.current).toBe('hello');
  });

  it('updates to the new value only after delayMs of stable input', () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    });

    expect(result.current).toBe('a');

    // Rapid changes within the debounce window — only the last should land.
    rerender({ v: 'al' });
    rerender({ v: 'ali' });
    rerender({ v: 'alic' });
    rerender({ v: 'alice' });

    // Mid-window: still on initial.
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('a');

    // Past the delay: latest value wins.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('alice');
  });

  it('cancels pending timer on unmount (no setState after unmount)', () => {
    // If cleanup is missing, React will warn "Can't perform a React state
    // update on an unmounted component." We spy on console.error to catch
    // that warning.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, rerender, unmount } = renderHook(
      ({ v }) => useDebounce(v, 300),
      { initialProps: { v: 'a' } }
    );

    expect(result.current).toBe('a');

    // Schedule a pending update, then unmount before the timer fires.
    rerender({ v: 'b' });
    unmount();

    // Advance past the delay — if cleanup ran, no setState is attempted
    // and React emits no "update on unmounted component" warning.
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const offendingCalls = errorSpy.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('unmounted component')
    );
    expect(offendingCalls).toHaveLength(0);
  });
});
