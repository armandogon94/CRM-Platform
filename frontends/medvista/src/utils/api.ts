import type { ApiResponse } from '../types';

const API_BASE = '/api/v1';

let authToken: string | null = localStorage.getItem('medvista_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('medvista_token', token);
  } else {
    localStorage.removeItem('medvista_token');
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
  login: (email: string, password: string) =>
    request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request<{ user: any }>('/auth/me'),

  getWorkspace: (id: number) => request<{ workspace: any }>(`/workspaces/${id}`),

  getBoards: (workspaceId: number) =>
    request<{ boards: any[] }>(`/boards?workspaceId=${workspaceId}`),

  getBoard: (id: number) => request<{ board: any }>(`/boards/${id}`),

  getBoardItems: (boardId: number) =>
    request<{ items: any[] }>(`/boards/${boardId}/items`),

  createItem: (data: { boardId: number; groupId: number; name: string; values?: Record<number, unknown> }) =>
    request<{ item: any }>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (id: number, data: Record<string, unknown>) =>
    request<{ item: any }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateColumnValues: (itemId: number, values: { columnId: number; value: unknown }[]) =>
    request<{ values: any[] }>(`/items/${itemId}/values`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }),

  // Slice 20 C2: wires to the flat DELETE /items/:id shim added in A2.5.
  deleteItem: (id: number) =>
    request<null>(`/items/${id}`, { method: 'DELETE' }),

  getAutomations: (boardId: number) =>
    request<{ automations: any[] }>(`/automations?boardId=${boardId}`),

  triggerAutomation: (id: number) =>
    request<{ log: any }>(`/automations/${id}/trigger`, { method: 'POST' }),
};
