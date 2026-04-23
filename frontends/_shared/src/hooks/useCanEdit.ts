import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types/index';

/**
 * RBAC affordance hook — Slice 20 A4.
 *
 * Single source of truth for "should this user see this button?"
 * questions across the 10 industry shells. Returns a stable booleans
 * matrix derived from `useAuth().user.role`; every industry's App.tsx
 * calls this instead of scattering `user.role === 'admin'` checks.
 *
 * The backend's route handlers are still authoritative — this hook
 * only gates UI *visibility*, not data access. A malicious client
 * that unhides a button still hits the same 403 path because the
 * backend never trusts the UI. (See A2.5 for the cross-workspace
 * board-create 403 example.)
 *
 * Matrix (see SPEC.md §Slice 20 RBAC UI matrix):
 *
 *   admin:    every affordance
 *   member:   no board create; all item affordances on
 *   viewer:   nothing
 *   (no user): safe-default all-false — avoids flashing CRUD UI during
 *             logout or between token refreshes
 */

export interface CanEditMatrix {
  canCreateBoard: boolean;
  canCreateItem: boolean;
  canEditInline: boolean;
  canDelete: boolean;
}

const NONE: CanEditMatrix = {
  canCreateBoard: false,
  canCreateItem: false,
  canEditInline: false,
  canDelete: false,
};

function computeMatrix(role: User['role'] | null): CanEditMatrix {
  switch (role) {
    case 'admin':
      return {
        canCreateBoard: true,
        canCreateItem: true,
        canEditInline: true,
        canDelete: true,
      };
    case 'member':
      return {
        canCreateBoard: false,
        canCreateItem: true,
        canEditInline: true,
        canDelete: true,
      };
    case 'viewer':
    default:
      return NONE;
  }
}

export function useCanEdit(): CanEditMatrix {
  const { user } = useAuth();
  const role = user?.role ?? null;

  // Memoise on role so consumers that subscribe to this matrix (e.g.
  // KanbanView, Sidebar's New Board button) get a stable reference and
  // don't re-render for unrelated auth-context updates.
  return useMemo(() => computeMatrix(role), [role]);
}
