import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';

// Mock the api module
const mockGet = vi.fn();
const mockPut = vi.fn();
vi.mock('@/utils/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

// Mock useWebSocket
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ success: true, data: { count: 0 } });
  });

  it('renders bell icon', async () => {
    render(<NotificationBell />);
    expect(screen.getByTestId('notification-bell')).toBeDefined();
  });

  it('shows unread count badge when count > 0', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: { count: 3 } });
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByTestId('unread-badge')).toBeDefined();
      expect(screen.getByTestId('unread-badge').textContent).toBe('3');
    });
  });

  it('hides badge when unread count is 0', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: { count: 0 } });
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByTestId('unread-badge')).toBeNull();
    });
  });

  it('toggles notification panel on bell click', async () => {
    mockGet
      .mockResolvedValueOnce({ success: true, data: { count: 0 } })
      .mockResolvedValueOnce({
        success: true,
        data: { notifications: [], pagination: { total: 0 } },
      });

    render(<NotificationBell />);

    fireEvent.click(screen.getByTestId('notification-bell'));

    await waitFor(() => {
      expect(screen.getByTestId('notification-panel')).toBeDefined();
    });

    // Click bell again to close
    fireEvent.click(screen.getByTestId('notification-bell'));
    expect(screen.queryByTestId('notification-panel')).toBeNull();
  });

  it('displays notifications in panel', async () => {
    const notifs = [
      { id: 1, title: 'Task assigned', message: 'You got task #5', type: 'info', isRead: false, createdAt: new Date().toISOString() },
      { id: 2, title: 'Update complete', message: null, type: 'success', isRead: true, createdAt: new Date().toISOString() },
    ];
    mockGet
      .mockResolvedValueOnce({ success: true, data: { count: 1 } })
      .mockResolvedValueOnce({
        success: true,
        data: { notifications: notifs, pagination: { total: 2 } },
      });

    render(<NotificationBell />);
    fireEvent.click(screen.getByTestId('notification-bell'));

    await waitFor(() => {
      expect(screen.getByText('Task assigned')).toBeDefined();
      expect(screen.getByText('Update complete')).toBeDefined();
    });
  });

  it('marks notification as read on click', async () => {
    const notifs = [
      { id: 1, title: 'New item', message: null, type: 'info', isRead: false, createdAt: new Date().toISOString() },
    ];
    mockGet
      .mockResolvedValueOnce({ success: true, data: { count: 1 } })
      .mockResolvedValueOnce({
        success: true,
        data: { notifications: notifs, pagination: { total: 1 } },
      });
    mockPut.mockResolvedValue({ success: true });

    render(<NotificationBell />);
    fireEvent.click(screen.getByTestId('notification-bell'));

    await waitFor(() => {
      expect(screen.getByText('New item')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('notification-item-1'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/notifications/1/read');
    });
  });

  it('marks all as read when button clicked', async () => {
    const notifs = [
      { id: 1, title: 'Notif 1', message: null, type: 'info', isRead: false, createdAt: new Date().toISOString() },
    ];
    mockGet
      .mockResolvedValueOnce({ success: true, data: { count: 1 } })
      .mockResolvedValueOnce({
        success: true,
        data: { notifications: notifs, pagination: { total: 1 } },
      });
    mockPut.mockResolvedValue({ success: true });

    render(<NotificationBell />);
    fireEvent.click(screen.getByTestId('notification-bell'));

    await waitFor(() => {
      expect(screen.getByTestId('mark-all-read')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('mark-all-read'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  it('subscribes to notification:created WS event', () => {
    render(<NotificationBell />);
    expect(mockSubscribe).toHaveBeenCalledWith('notification:created', expect.any(Function));
  });
});
