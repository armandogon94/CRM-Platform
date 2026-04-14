import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBoards } from './useBoards';
import { makeBoard } from '@/test/fixtures';

const mockGet = vi.fn();
vi.mock('@/utils/api', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
  default: { get: (...args: any[]) => mockGet(...args) },
}));

const BOARDS = [makeBoard({ id: 1 }), makeBoard({ id: 2 })];

describe('useBoards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches boards when workspaceId is provided', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: { boards: BOARDS } });

    const { result } = renderHook(() => useBoards(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/boards?workspaceId=1');
    expect(result.current.boards).toHaveLength(2);
  });

  it('does not fetch when workspaceId is undefined', async () => {
    const { result } = renderHook(() => useBoards(undefined));

    // Give it a tick to settle
    await waitFor(() => expect(result.current.loading).toBeDefined());
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns refetch function that re-fetches boards', async () => {
    mockGet.mockResolvedValue({ success: true, data: { boards: BOARDS } });

    const { result } = renderHook(() => useBoards(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGet.mockClear();
    await result.current.refetch();

    expect(mockGet).toHaveBeenCalledWith('/boards?workspaceId=1');
  });

  it('returns empty boards array when API fails', async () => {
    mockGet.mockResolvedValueOnce({ success: false });

    const { result } = renderHook(() => useBoards(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.boards).toEqual([]);
  });
});
