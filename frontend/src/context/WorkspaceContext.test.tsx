import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { makeUser, makeWorkspace, makeBoard } from '@/test/fixtures';

// --- Mocks ---

const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockApiGet = vi.fn();

vi.mock('@/utils/api', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
  default: { get: (...args: any[]) => mockApiGet(...args) },
}));

// --- Wrapper ---

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkspaceProvider>{children}</WorkspaceProvider>
);

// --- Tests ---

describe('WorkspaceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls api.get for workspace and boards when authenticated with workspaceId', async () => {
    const user = makeUser({ workspaceId: 1 });
    mockUseAuth.mockReturnValue({ user, isAuthenticated: true });

    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ success: true, data: { workspace: makeWorkspace() } });
      }
      return Promise.resolve({ success: true, data: { boards: [] } });
    });

    renderHook(() => useWorkspace(), { wrapper });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/workspaces/1');
      expect(mockApiGet).toHaveBeenCalledWith('/boards?workspaceId=1');
    });
  });

  it('sets workspace state from API response', async () => {
    const user = makeUser({ workspaceId: 1 });
    const ws = makeWorkspace({ name: 'Acme Corp' });
    mockUseAuth.mockReturnValue({ user, isAuthenticated: true });

    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ success: true, data: { workspace: ws } });
      }
      return Promise.resolve({ success: true, data: { boards: [] } });
    });

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    await waitFor(() => {
      expect(result.current.workspace?.name).toBe('Acme Corp');
    });
  });

  it('sets boards state from API response', async () => {
    const user = makeUser({ workspaceId: 1 });
    const boards = [
      makeBoard({ id: 1, name: 'Board A' }),
      makeBoard({ id: 2, name: 'Board B' }),
    ];
    mockUseAuth.mockReturnValue({ user, isAuthenticated: true });

    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ success: true, data: { workspace: makeWorkspace() } });
      }
      return Promise.resolve({ success: true, data: { boards } });
    });

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    await waitFor(() => {
      expect(result.current.boards).toHaveLength(2);
      expect(result.current.boards[0].name).toBe('Board A');
    });
  });

  it('does NOT call API when not authenticated — workspace and boards stay empty', async () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    // Give any async effects a chance to run
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result.current.workspace).toBeNull();
    expect(result.current.boards).toEqual([]);
  });

  it('refreshBoards re-fetches boards from the API', async () => {
    const user = makeUser({ workspaceId: 1 });
    const initialBoards = [makeBoard({ id: 1, name: 'Board A' })];
    const refreshedBoards = [
      makeBoard({ id: 1, name: 'Board A' }),
      makeBoard({ id: 2, name: 'Board B' }),
    ];

    mockUseAuth.mockReturnValue({ user, isAuthenticated: true });

    mockApiGet
      .mockImplementation((url: string) => {
        if (url.includes('/workspaces/')) {
          return Promise.resolve({ success: true, data: { workspace: makeWorkspace() } });
        }
        return Promise.resolve({ success: true, data: { boards: initialBoards } });
      });

    const { result } = renderHook(() => useWorkspace(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.boards).toHaveLength(1);
    });

    // Set up refreshed data for subsequent calls
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/workspaces/')) {
        return Promise.resolve({ success: true, data: { workspace: makeWorkspace() } });
      }
      return Promise.resolve({ success: true, data: { boards: refreshedBoards } });
    });

    await result.current.refreshBoards();

    await waitFor(() => {
      expect(result.current.boards).toHaveLength(2);
      expect(result.current.boards[1].name).toBe('Board B');
    });
  });

  it('useWorkspace throws when used outside WorkspaceProvider', () => {
    // Suppress the expected React error boundary output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useWorkspace());
    }).toThrow('useWorkspace must be used within a WorkspaceProvider');

    consoleSpy.mockRestore();
  });
});
