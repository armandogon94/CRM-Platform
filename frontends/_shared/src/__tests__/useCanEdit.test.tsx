// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useCanEdit } from '../hooks/useCanEdit';

/**
 * RBAC affordance hook tests (Slice 20 A4).
 *
 * The hook returns a matrix of booleans — one per CRUD affordance —
 * derived from useAuth().user.role. Single source of truth so every
 * industry shell gates the "New Board", "New Item", "inline edit",
 * and "delete" buttons against the same policy.
 *
 * SPEC RECONCILIATION: The spec's original RBAC matrix included a
 * `manager` row, but the shared User type + backend UserRole enum only
 * define `'admin' | 'member' | 'viewer'`. No `manager` seed data exists
 * either (the few `manager@*` emails in seeds use role='member' or
 * role='admin'). Dropped the `manager` row from the matrix during A4 —
 * if it's ever added as a real role, extending this hook is a one-line
 * switch case.
 *
 * Mocking strategy: stub useAuth per test — cheaper than constructing
 * a full AuthProvider + mock login flow. The hook has no other
 * dependencies so the stub is sufficient for behaviour coverage.
 */

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import type { User } from '../types/index';

function makeUser(role: User['role']): User {
  return {
    id: 1,
    email: `user@example.com`,
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    role,
    workspaceId: 1,
  };
}

// Harness component renders the hook result so the test can assert the
// full matrix shape. Exposing the hook value via data attributes keeps
// the test dom-based rather than poking at closures.
function Harness({ onReady }: { onReady: (result: ReturnType<typeof useCanEdit>) => void }) {
  const result = useCanEdit();
  React.useEffect(() => {
    onReady(result);
  }, [result, onReady]);
  return null;
}

function renderWithRole(role: User['role'] | null) {
  mockUseAuth.mockReturnValue({
    user: role ? makeUser(role) : null,
    accessToken: role ? 'token' : null,
    isAuthenticated: !!role,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  });
  let out!: ReturnType<typeof useCanEdit>;
  render(<Harness onReady={(r) => (out = r)} />);
  return out;
}

describe('useCanEdit()', () => {
  describe('role → affordance matrix', () => {
    it('admin gets every affordance', () => {
      const perms = renderWithRole('admin');
      expect(perms).toEqual({
        canCreateBoard: true,
        canCreateItem: true,
        canEditInline: true,
        canDelete: true,
      });
    });

    it('member can create/edit/delete items but NOT create boards', () => {
      const perms = renderWithRole('member');
      expect(perms).toEqual({
        canCreateBoard: false,
        canCreateItem: true,
        canEditInline: true,
        canDelete: true,
      });
    });

    it('viewer sees no CRUD affordances', () => {
      const perms = renderWithRole('viewer');
      expect(perms).toEqual({
        canCreateBoard: false,
        canCreateItem: false,
        canEditInline: false,
        canDelete: false,
      });
    });

    it('returns the all-false matrix when no user is authenticated', () => {
      // Edge case — during logout or between token refreshes the
      // UI may render briefly with user=null. Failing closed
      // (no affordances) is the safe default.
      const perms = renderWithRole(null);
      expect(perms).toEqual({
        canCreateBoard: false,
        canCreateItem: false,
        canEditInline: false,
        canDelete: false,
      });
    });
  });

  describe('reference stability', () => {
    it('returns the same object reference for unchanged role across re-renders', () => {
      mockUseAuth.mockReturnValue({
        user: makeUser('admin'),
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });

      const results: ReturnType<typeof useCanEdit>[] = [];
      function Stability() {
        results.push(useCanEdit());
        return null;
      }
      const { rerender } = render(<Stability />);
      rerender(<Stability />);
      rerender(<Stability />);

      // Every call should have produced the same object reference —
      // the useMemo dep is role only, so re-renders with a stable
      // role should not allocate a new matrix.
      expect(results[1]).toBe(results[0]);
      expect(results[2]).toBe(results[0]);
    });
  });
});
