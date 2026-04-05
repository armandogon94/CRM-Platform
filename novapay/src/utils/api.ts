import type { ApiResponse } from '../types';

const API_BASE = '/api/v1';

let authToken: string | null = localStorage.getItem('novapay_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('novapay_token', token);
  } else {
    localStorage.removeItem('novapay_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request<{ user: unknown }>('/auth/me'),

  // Workspaces
  getWorkspace: (id: number) => request<{ workspace: unknown }>(`/workspaces/${id}`),

  // Boards
  getBoards: (workspaceId: number) =>
    request<{ boards: unknown[] }>(`/boards?workspaceId=${workspaceId}`),

  getBoard: (id: number) => request<{ board: unknown }>(`/boards/${id}`),

  getBoardItems: (boardId: number) =>
    request<{ items: unknown[] }>(`/boards/${boardId}/items`),

  // Items
  createItem: (data: { boardId: number; groupId: number; name: string; values?: Record<number, unknown> }) =>
    request<{ item: unknown }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (id: number, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateColumnValues: (itemId: number, values: { columnId: number; value: unknown }[]) =>
    request<{ values: unknown[] }>(`/items/${itemId}/values`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }),

  // Automations
  getAutomations: (boardId: number) =>
    request<{ automations: unknown[] }>(`/automations?boardId=${boardId}`),

  triggerAutomation: (id: number) =>
    request<{ log: unknown }>(`/automations/${id}/trigger`, { method: 'POST' }),
};
