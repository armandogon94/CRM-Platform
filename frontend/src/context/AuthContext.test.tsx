import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the api module - AuthContext imports api as default
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/utils/api', () => ({
  api: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    put: vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  email: 'admin@crm-platform.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows isLoading=true initially and false after effect resolves (with token)', async () => {
    localStorage.setItem('crm_access_token', 'test-token');
    mockGet.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('calls /auth/me and sets user on success when token exists', async () => {
    localStorage.setItem('crm_access_token', 'test-token');
    mockGet.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledWith('/auth/me');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears tokens and user remains null when /auth/me fails (success: false)', async () => {
    localStorage.setItem('crm_access_token', 'bad-token');
    localStorage.setItem('crm_refresh_token', 'bad-refresh');
    mockGet.mockResolvedValue({
      success: false,
      error: 'Unauthorized',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('crm_access_token')).toBeNull();
    expect(localStorage.getItem('crm_refresh_token')).toBeNull();
  });

  it('sets isLoading=false without calling /auth/me when no token', async () => {
    // No token in localStorage
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('login() success: stores tokens in localStorage and sets user state', async () => {
    mockPost.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('admin@crm-platform.com', 'password123');
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@crm-platform.com',
      password: 'password123',
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe('new-access-token');
    expect(localStorage.getItem('crm_access_token')).toBe('new-access-token');
    expect(localStorage.getItem('crm_refresh_token')).toBe('new-refresh-token');
  });

  it('login() failure: throws with error message', async () => {
    mockPost.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('admin@crm-platform.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');
  });

  it('logout(): clears localStorage tokens and sets user to null', async () => {
    localStorage.setItem('crm_access_token', 'test-token');
    mockGet.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(localStorage.getItem('crm_access_token')).toBeNull();
    expect(localStorage.getItem('crm_refresh_token')).toBeNull();
  });

  it('register() success: stores tokens and sets user state', async () => {
    const registerData = {
      email: 'new@crm-platform.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      workspaceName: 'My Workspace',
    };

    mockPost.mockResolvedValue({
      success: true,
      data: {
        user: { ...mockUser, email: registerData.email },
        accessToken: 'reg-access-token',
        refreshToken: 'reg-refresh-token',
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/register', registerData);
    expect(result.current.user).toBeTruthy();
    expect(result.current.accessToken).toBe('reg-access-token');
    expect(localStorage.getItem('crm_access_token')).toBe('reg-access-token');
  });
});
