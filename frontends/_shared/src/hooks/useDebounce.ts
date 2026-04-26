import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value. Returns a copy of `value` that only
 * updates after `delayMs` of stable input — last-wins, trailing edge.
 *
 * Slice 21B B2: powers the person-picker search input. Without the
 * cleanup → clearTimeout, typing-then-navigate-away would leak timers
 * and may setState on an unmounted component.
 *
 * Pair with the `signal` parameter of `api.workspaces.searchMembers` to
 * also abort in-flight stale requests (debouncing only cancels timers,
 * not the request the previous timer already fired).
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

export default useDebounce;
