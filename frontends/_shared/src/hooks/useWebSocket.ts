import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Item, ColumnValue, Notification } from '../types/index';
import type { FileAttachment } from '../utils/api';

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
  // Slice 21A D2 — file:created / file:deleted echoes from POST /files/upload
  // and DELETE /files/:id (see backend Slice 21A D1). itemId + columnValueId
  // let consumers pinpoint which cell-value to mutate; columnValueId is
  // optional because not every file is column-scoped (item-level orphans
  // currently skip the emit, but the type permits future at-item flows).
  onFileCreated?: (data: {
    file: FileAttachment;
    itemId: number;
    columnValueId?: number;
  }) => void;
  onFileDeleted?: (data: {
    fileId: number;
    itemId: number;
    columnValueId?: number;
  }) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (event: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (event: string, callback: (...args: any[]) => void) => void;
}

const SOCKET_URL = 'http://localhost:13000';

// Module-level token-key state. Defaults to 'crm_access_token' for back-
// compat with Slice 19 E2E paths. Industries override per-instance via
// configureWebSocket({ tokenKey }) in main.tsx, mirroring the existing
// configureApi({ tokenKey }) pattern from utils/api.ts.
//
// Slice 20.5 A1 — closes the only unticked Slice 20 success criterion
// (real-time WS echo on CRUD path). See SPEC.md §Slice 20.5.
let _tokenKey = 'crm_access_token';

export function configureWebSocket(options: { tokenKey?: string }): void {
  if (options.tokenKey) {
    _tokenKey = options.tokenKey;
  }
}

export function useWebSocket(
  boardId?: number,
  callbacks?: WebSocketCallbacks
): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = localStorage.getItem(_tokenKey);

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

    // Slice 21A D2 — file echoes (paired with backend D1 wsService.emitToBoard).
    socket.on(
      'file:created',
      (data: { file: FileAttachment; itemId: number; columnValueId?: number }) => {
        callbacksRef.current?.onFileCreated?.(data);
      }
    );

    socket.on(
      'file:deleted',
      (data: { fileId: number; itemId: number; columnValueId?: number }) => {
        callbacksRef.current?.onFileDeleted?.(data);
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
