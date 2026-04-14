import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

const mockEmit = vi.fn();
const mockDisconnect = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

const mockSocket = {
  emit: mockEmit,
  disconnect: mockDisconnect,
  on: mockOn,
  off: mockOff,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Helper to simulate a named socket event
function fireSocketEvent(eventName: string, payload?: unknown) {
  const call = mockOn.mock.calls.find((c) => c[0] === eventName);
  const handler = call?.[1];
  if (handler) {
    act(() => handler(payload));
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('creates a socket connection via io()', async () => {
    const { io } = await import('socket.io-client');
    renderHook(() => useWebSocket());
    expect(io).toHaveBeenCalled();
  });

  it('subscribe(event, cb) calls socket.on(event, cb)', () => {
    const { result } = renderHook(() => useWebSocket());
    const handler = vi.fn();
    act(() => {
      result.current.subscribe('custom:event', handler);
    });
    expect(mockOn).toHaveBeenCalledWith('custom:event', handler);
  });

  it('unsubscribe(event, cb) calls socket.off(event, cb)', () => {
    const { result } = renderHook(() => useWebSocket());
    const handler = vi.fn();
    act(() => {
      result.current.unsubscribe('custom:event', handler);
    });
    expect(mockOff).toHaveBeenCalledWith('custom:event', handler);
  });

  it('emits board:join with boardId when connect fires and boardId is provided', () => {
    renderHook(() => useWebSocket(42));
    fireSocketEvent('connect');
    expect(mockEmit).toHaveBeenCalledWith('board:join', { boardId: 42 });
  });

  it('does not emit board:join when no boardId is provided', () => {
    renderHook(() => useWebSocket());
    fireSocketEvent('connect');
    expect(mockEmit).not.toHaveBeenCalledWith('board:join', expect.anything());
  });

  it('emits board:leave and disconnects on unmount when boardId is provided', () => {
    const { unmount } = renderHook(() => useWebSocket(42));
    unmount();
    expect(mockEmit).toHaveBeenCalledWith('board:leave', { boardId: 42 });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('isConnected becomes true on connect event and false on disconnect event', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(false);

    fireSocketEvent('connect');
    expect(result.current.isConnected).toBe(true);

    fireSocketEvent('disconnect');
    expect(result.current.isConnected).toBe(false);
  });

  it('calls onItemCreated callback when item:created event fires', () => {
    const onItemCreated = vi.fn();
    renderHook(() => useWebSocket(42, { onItemCreated }));

    const fakeItem = { id: 1, boardId: 42, name: 'New Item' };
    fireSocketEvent('item:created', fakeItem);

    expect(onItemCreated).toHaveBeenCalledWith(fakeItem);
  });

  it('calls onItemUpdated callback when item:updated event fires', () => {
    const onItemUpdated = vi.fn();
    renderHook(() => useWebSocket(42, { onItemUpdated }));

    const fakeItem = { id: 2, boardId: 42, name: 'Updated Item' };
    fireSocketEvent('item:updated', fakeItem);

    expect(onItemUpdated).toHaveBeenCalledWith(fakeItem);
  });

  it('calls onItemDeleted callback when item:deleted event fires', () => {
    const onItemDeleted = vi.fn();
    renderHook(() => useWebSocket(42, { onItemDeleted }));

    fireSocketEvent('item:deleted', { itemId: 7 });

    expect(onItemDeleted).toHaveBeenCalledWith({ itemId: 7 });
  });

  it('calls onColumnValueChanged callback when column_value:changed event fires', () => {
    const onColumnValueChanged = vi.fn();
    renderHook(() => useWebSocket(42, { onColumnValueChanged }));

    const data = { itemId: 1, columnId: 200, value: { label: 'Done' } };
    fireSocketEvent('column_value:changed', data);

    expect(onColumnValueChanged).toHaveBeenCalledWith(data);
  });

  it('calls onNotificationCreated callback when notification:created event fires', () => {
    const onNotificationCreated = vi.fn();
    renderHook(() => useWebSocket(42, { onNotificationCreated }));

    const notif = { id: 99, message: 'Hello' };
    fireSocketEvent('notification:created', notif);

    expect(onNotificationCreated).toHaveBeenCalledWith(notif);
  });
});
