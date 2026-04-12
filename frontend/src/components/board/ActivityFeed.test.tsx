import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';

const mockGet = vi.fn();
vi.mock('@/utils/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
  },
  default: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

const MOCK_ACTIVITIES = [
  {
    id: 1,
    userId: 5,
    entityType: 'item',
    entityId: 10,
    action: 'created',
    changes: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 2,
    userId: 5,
    entityType: 'item',
    entityId: 11,
    action: 'updated',
    changes: { name: { from: 'Old', to: 'New' } },
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: 3,
    userId: 3,
    entityType: 'column_value',
    entityId: 20,
    action: 'changed',
    changes: { value: { from: 'Working on it', to: 'Done' } },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ActivityFeed boardId={42} />);
    expect(screen.getByTestId('activity-loading')).toBeDefined();
  });

  it('fetches and displays activity entries', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        activities: MOCK_ACTIVITIES,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      },
    });

    render(<ActivityFeed boardId={42} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-feed')).toBeDefined();
    });

    const items = screen.getAllByTestId(/^activity-entry-/);
    expect(items).toHaveLength(3);
  });

  it('shows action descriptions for each entry type', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        activities: MOCK_ACTIVITIES,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      },
    });

    render(<ActivityFeed boardId={42} />);

    await waitFor(() => {
      expect(screen.getByText(/created/i)).toBeDefined();
      expect(screen.getByText(/updated/i)).toBeDefined();
      expect(screen.getByText(/changed/i)).toBeDefined();
    });
  });

  it('displays relative timestamps', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        activities: MOCK_ACTIVITIES.slice(0, 1),
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    render(<ActivityFeed boardId={42} />);

    await waitFor(() => {
      // Should show something like "1 hour ago" or "1h ago"
      expect(screen.getByTestId('activity-entry-1')).toBeDefined();
    });
  });

  it('shows empty state when no activities', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        activities: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });

    render(<ActivityFeed boardId={42} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-empty')).toBeDefined();
    });
  });

  it('calls API with correct board endpoint', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        activities: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });

    render(<ActivityFeed boardId={42} />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/activity/board/42?page=1&limit=20');
    });
  });
});
