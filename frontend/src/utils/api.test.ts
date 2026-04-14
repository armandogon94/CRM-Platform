import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these spies are created before vi.mock factories run,
// which in turn run before the module-level `await import('./api')`.
const { requestInterceptorUse, responseInterceptorUse, mockAxiosInstance } = vi.hoisted(() => {
  const requestInterceptorUse = vi.fn();
  const responseInterceptorUse = vi.fn();

  const mockAxiosInstance = vi.fn() as any;
  mockAxiosInstance.interceptors = {
    request: { use: requestInterceptorUse },
    response: { use: responseInterceptorUse },
  };

  return { requestInterceptorUse, responseInterceptorUse, mockAxiosInstance };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

// Import AFTER mocks are set up. The module runs its interceptors.request.use /
// interceptors.response.use calls at this point.
const { api } = await import('./api');

// Capture the interceptor handlers ONCE before any test clears mock state.
// The api module registers them exactly once at import time.
const requestFulfilled: (cfg: any) => any = requestInterceptorUse.mock.calls[0][0];
const requestRejected: (err: any) => any = requestInterceptorUse.mock.calls[0][1];

describe('api utility', () => {
  beforeEach(() => {
    // Only reset the call counts of the axios instance mock (not the interceptor spies,
    // whose call records we've already captured above).
    mockAxiosInstance.mockReset();
    localStorage.clear();
  });

  it('registers a request interceptor on the axios instance', () => {
    expect(requestInterceptorUse).toHaveBeenCalled();
  });

  it('registers a response interceptor on the axios instance', () => {
    expect(responseInterceptorUse).toHaveBeenCalled();
  });

  it('request interceptor adds Authorization header when token exists', () => {
    localStorage.setItem('crm_access_token', 'test-token-123');
    const config = { headers: {} as Record<string, string> };
    const result = requestFulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('request interceptor does NOT add Authorization header when no token', () => {
    localStorage.removeItem('crm_access_token');
    const config = { headers: {} as Record<string, string> };
    const result = requestFulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('returns { success: true, data } on a successful GET', async () => {
    mockAxiosInstance.mockResolvedValueOnce({
      data: { success: true, data: { id: 1 } },
    });

    const result = await api.get('/test-endpoint');

    expect(result).toEqual({ success: true, data: { id: 1 } });
    expect(mockAxiosInstance).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: '/test-endpoint' })
    );
  });

  it('returns { success: false, error } on a network error', async () => {
    const networkError = new Error('Network error');
    mockAxiosInstance.mockRejectedValueOnce(networkError);

    const result = await api.get('/failing-endpoint');

    expect(result).toEqual({ success: false, error: 'Network error' });
  });

  it('returns the server error body when server responds with an error', async () => {
    const serverError = Object.assign(new Error('Bad request'), {
      response: { data: { success: false, error: 'Not found' } },
    });
    mockAxiosInstance.mockRejectedValueOnce(serverError);

    const result = await api.get('/not-found');

    expect(result).toEqual({ success: false, error: 'Not found' });
  });

  it('calls axiosInstance with POST method and data', async () => {
    mockAxiosInstance.mockResolvedValueOnce({
      data: { success: true, data: { board: { id: 5 } } },
    });

    const payload = { name: 'My Board', workspaceId: 1 };
    const result = await api.post('/boards', payload);

    expect(result).toEqual({ success: true, data: { board: { id: 5 } } });
    expect(mockAxiosInstance).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: '/boards', data: payload })
    );
  });
});
