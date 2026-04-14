import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { User, Workspace, Board } from '@/types';
import { makeUser, makeWorkspace } from './fixtures';

// Re-export everything from RTL for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// --- Context value shapes (mirroring actual context types) ---

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    workspaceName?: string;
  }) => Promise<void>;
}

interface WorkspaceContextValue {
  workspace: Workspace | null;
  boards: Board[];
  selectedBoard: Board | null;
  setSelectedBoard: (board: Board | null) => void;
  refreshBoards: () => Promise<void>;
  isLoading: boolean;
}

// --- renderWithProviders ---

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<AuthContextValue>;
  workspaceValue?: Partial<WorkspaceContextValue>;
  initialEntries?: string[];
}

/**
 * Wraps components in MemoryRouter + mocked context providers.
 * All tests that need routing or auth/workspace context should use this.
 *
 * By default renders as an authenticated admin user with an empty board list.
 */
export function renderWithProviders(
  ui: ReactNode,
  options: RenderWithProvidersOptions = {}
) {
  const { authValue, workspaceValue, initialEntries = ['/'], ...renderOptions } = options;

  const defaultAuthValue: AuthContextValue = {
    user: makeUser(),
    accessToken: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    ...authValue,
  };

  const defaultWorkspaceValue: WorkspaceContextValue = {
    workspace: makeWorkspace(),
    boards: [],
    selectedBoard: null,
    setSelectedBoard: vi.fn(),
    refreshBoards: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    ...workspaceValue,
  };

  // We use module mocking in individual test files for contexts.
  // This wrapper provides router + bare context mocks via vi.mock at the test level.
  // For tests that need real provider behavior, import AuthProvider/WorkspaceProvider directly.
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    );
  }

  // Expose default values so tests can access them without re-declaring
  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  return { ...result, defaultAuthValue, defaultWorkspaceValue };
}
