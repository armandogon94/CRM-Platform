import type { ApiResponse, Item, Board, ColumnValue } from '../types/index';

// Configurable settings — can be overridden per industry frontend via configureApi()
let _baseUrl = '/api/v1';
let _tokenKey = 'crm_access_token';

export function configureApi(options: { baseUrl?: string; tokenKey?: string }) {
  if (options.baseUrl) _baseUrl = options.baseUrl;
  if (options.tokenKey) _tokenKey = options.tokenKey;
}

async function request<T>(
  method: string,
  url: string,
  data?: any
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(_tokenKey);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${_baseUrl}${url}`, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem(_tokenKey);
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const json: ApiResponse<T> = await res.json();
    return json;
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

/**
 * Typed CRUD mutation surfaces.
 *
 * Slice 20 A2 contract — industry App shells + useBoard mutations call
 * these instead of the generic `api.post/put/delete` helpers so the
 * request shape and URL are verified at compile-time, not discovered at
 * runtime. The endpoints target the flat convenience routes in
 * backend/src/routes/index.ts (e.g. POST /items), not the nested
 * /workspaces/:w/boards/:b/items form, because the flat routes already
 * infer workspaceId from the authenticated user.
 */

export interface CreateItemInput {
  boardId: number;
  groupId: number;
  name: string;
  values?: Record<number, unknown>;
}

export interface UpdateItemInput {
  name?: string;
  position?: number;
  groupId?: number;
}

export interface UpdateColumnValuesInput {
  columnId: number;
  value: unknown;
}

export interface CreateBoardInput {
  name: string;
  description?: string | null;
  workspaceId: number;
  boardType: 'main' | 'shareable' | 'private';
}

export const api = {
  get<T>(url: string): Promise<ApiResponse<T>> {
    return request<T>('GET', url);
  },

  post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return request<T>('POST', url, data);
  },

  put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return request<T>('PUT', url, data);
  },

  delete<T>(url: string): Promise<ApiResponse<T>> {
    return request<T>('DELETE', url);
  },

  // ── Item mutations (POST/PUT/DELETE) ────────────────────────────────
  items: {
    create(input: CreateItemInput): Promise<ApiResponse<{ item: Item }>> {
      return request<{ item: Item }>('POST', '/items', input);
    },

    update(
      itemId: number,
      input: UpdateItemInput
    ): Promise<ApiResponse<{ item: Item }>> {
      return request<{ item: Item }>('PUT', `/items/${itemId}`, input);
    },

    updateValues(
      itemId: number,
      values: UpdateColumnValuesInput[]
    ): Promise<ApiResponse<{ values: ColumnValue[] }>> {
      return request<{ values: ColumnValue[] }>(
        'PUT',
        `/items/${itemId}/values`,
        { values }
      );
    },

    delete(itemId: number): Promise<ApiResponse<null>> {
      return request<null>('DELETE', `/items/${itemId}`);
    },
  },

  // ── Board mutations (POST) ──────────────────────────────────────────
  boards: {
    create(input: CreateBoardInput): Promise<ApiResponse<{ board: Board }>> {
      return request<{ board: Board }>('POST', '/boards', input);
    },
  },
};

export default api;
