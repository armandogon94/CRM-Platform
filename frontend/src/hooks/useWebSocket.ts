import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Item, ColumnValue } from '@/types';

interface WebSocketCallbacks {
  onItemCreated?: (item: Item) => void;
  onItemUpdated?: (item: Item) => void;
  onItemDeleted?: (data: { itemId: number }) => void;
  onColumnValueChanged?: (data: {
    itemId: number;
    columnId: number;
    value: ColumnValue;
  }) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (event: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (event: string, callback: (...args: any[]) => void) => void;
}

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:13000';

export function useWebSocket(
  boardId?: number,
  callbacks?: WebSocketCallbacks
): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = localStorage.getItem('crm_access_token');

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      // Join board room if boardId is provided
      if (boardId) {
        socket.emit('board:join', { boardId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for board events
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
