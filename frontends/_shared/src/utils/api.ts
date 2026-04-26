import type { ApiResponse, Item, Board, ColumnValue } from '../types/index';

// Configurable settings — can be overridden per industry frontend via configureApi()
let _baseUrl = '/api/v1';
let _tokenKey = 'crm_access_token';

export function configureApi(options: { baseUrl?: string; tokenKey?: string }) {
  if (options.baseUrl) _baseUrl = options.baseUrl;
  if (options.tokenKey) _tokenKey = options.tokenKey;
}

/**
 * Reads the current bearer token from localStorage. Centralised so both the
 * fetch-based `request<T>` helper and the XHR-based `uploadWithProgress`
 * helper read from the same configurable key.
 */
function getAuthToken(): string | null {
  return localStorage.getItem(_tokenKey);
}

/**
 * XHR-based upload helper. Slice 21A ADR-1: `fetch()` does not surface
 * upload progress events; only `XMLHttpRequest.upload.onprogress` does.
 *
 * Resolves with the parsed JSON body on 2xx, rejects with `{ status,
 * message }` on non-2xx. The optional `onProgress` callback receives a
 * percentage (0–100) computed from `loaded / total`.
 *
 * Caller is responsible for building the FormData (this helper does not
 * set Content-Type — the browser supplies the multipart boundary).
 */
export function uploadWithProgress<T = unknown>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (onProgress) {
      xhr.upload.onprogress = (event: { loaded: number; total: number }) => {
        if (event.total > 0) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let parsed: any = null;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        parsed = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed as T);
      } else {
        const message =
          parsed?.error || parsed?.message || `Upload failed with status ${xhr.status}`;
        reject({ status: xhr.status, message });
      }
    };

    xhr.onerror = () => {
      reject({ status: 0, message: 'Network error during upload' });
    };

    xhr.send(formData);
  });
}

async function request<T>(
  method: string,
  url: string,
  data?: any
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

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

/**
 * Server-side `FileAttachment` row shape. Mirrors the backend Sequelize
 * model so consumers (FileUploader UI, useBoard handlers) can render
 * uploaded-file metadata without re-deriving types from the API response.
 */
export interface FileAttachment {
  id: number;
  itemId: number | null;
  columnValueId: number | null;
  workspaceId: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadFileOptions {
  itemId: number;
  columnValueId?: number;
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

  // ── File operations (multipart upload + list/delete) ────────────────
  // Slice 21A A1: thin typed wrapper over backend Slice 8 routes.
  // Upload uses XHR (uploadWithProgress) so progress events surface;
  // list and delete reuse the fetch-based request<T> helper.
  files: {
    upload(
      file: File,
      options: UploadFileOptions,
      onProgress?: (percent: number) => void
    ): Promise<ApiResponse<{ file: FileAttachment }>> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', String(options.itemId));
      if (options.columnValueId !== undefined) {
        formData.append('columnValueId', String(options.columnValueId));
      }

      return uploadWithProgress<ApiResponse<{ file: FileAttachment }>>(
        `${_baseUrl}/files/upload`,
        formData,
        onProgress
      );
    },

    list(query: { itemId: number }): Promise<ApiResponse<{ files: FileAttachment[] }>> {
      return request<{ files: FileAttachment[] }>(
        'GET',
        `/files?itemId=${query.itemId}`
      );
    },

    delete(fileId: number): Promise<ApiResponse<null>> {
      return request<null>('DELETE', `/files/${fileId}`);
    },
  },
};

export default api;
