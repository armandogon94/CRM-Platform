import type { ApiResponse } from '../types/index';

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
};

export default api;
