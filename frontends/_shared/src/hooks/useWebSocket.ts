import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Item, ColumnValue, Notification } from '../types/index';

interface WebSocketCallbacks {
  onItemCreated?: (item: Item) => void;
  onItemUpdated?: (item: Item) => void;
  onItemDeleted?: (data: { itemId: number }) => void;
  onColumnValueChanged?: (data: {
    itemId: number;
    columnId: number;
    value: ColumnValue;
  }) => void;
  onGroupCreated?: (group: any) => void;
  onGroupUpdated?: (group: any) => void;
  onGroupDeleted?: (data: { id: number; boardId: number }) => void;
  onColumnCreated?: (column: any) => void;
  onColumnUpdated?: (column: any) => void;
  onColumnDeleted?: (data: { id: number; boardId: number }) => void;
  onNotificationCreated?: (notification: Notification) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (event: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (event: string, callback: (...args: any[]) => void) => void;
}

const SOCKET_URL = 'http://localhost:13000';
const TOKEN_KEY = 'crm_access_token';

export function useWebSocket(
  boardId?: number,
  callbacks?: WebSocketCallbacks
): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (boardId) {
        socket.emit('board:join', { boardId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('item:created', (item: Item) => {
      callbacksRef.current?.onItemCreated?.(item);
    });

    socket.on('item:updated', (item: Item) => {
      callbacksRef.current?.onItemUpdated?.(item);
    });

    socket.on('item:deleted', (data: { itemId: number }) => {
      callbacksRef.current?.onItemDeleted?.(data);
    });

    socket.on(
      'column_value:changed',
      (data: { itemId: number; columnId: number; value: ColumnValue }) => {
        callbacksRef.current?.onColumnValueChanged?.(data);
      }
    );

    socket.on('group:created', (group: any) => {
      callbacksRef.current?.onGroupCreated?.(group);
    });

    socket.on('group:updated', (group: any) => {
      callbacksRef.current?.onGroupUpdated?.(group);
    });

    socket.on('group:deleted', (data: { id: number; boardId: number }) => {
      callbacksRef.current?.onGroupDeleted?.(data);
    });

    socket.on('column:created', (column: any) => {
      callbacksRef.current?.onColumnCreated?.(column);
    });

    socket.on('column:updated', (column: any) => {
      callbacksRef.current?.onColumnUpdated?.(column);
    });

    socket.on('column:deleted', (data: { id: number; boardId: number }) => {
      callbacksRef.current?.onColumnDeleted?.(data);
    });

    socket.on('notification:created', (notification: Notification) => {
      callbacksRef.current?.onNotificationCreated?.(notification);
    });

    return () => {
      if (boardId) {
        socket.emit('board:leave', { boardId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  const subscribe = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.on(event, callback);
    },
    []
  );

  const unsubscribe = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.off(event, callback);
    },
    []
  );

  return { isConnected, subscribe, unsubscribe };
}
