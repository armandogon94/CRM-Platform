import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@/types';
import api from '@/utils/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    workspaceName?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('crm_access_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Fetch current user profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('crm_access_token');
    if (token) {
      setAccessToken(token);
      api
        .get<{ user: User }>('/auth/me')
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data.user || (res.data as any));
          } else {
            // Token invalid, clear it
            localStorage.removeItem('crm_access_token');
            localStorage.removeItem('crm_refresh_token');
            setAccessToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('crm_access_token');
          localStorage.removeItem('crm_refresh_token');
          setAccessToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });

    if (res.success && res.data) {
      const { user: userData, accessToken: token, refreshToken } = res.data;
      localStorage.setItem('crm_access_token', token);
      if (refreshToken) {
        localStorage.setItem('crm_refresh_token', refreshToken);
      }
      setAccessToken(token);
      setUser(userData);
    } else {
      throw new Error(res.error || res.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_access_token');
    localStorage.removeItem('crm_refresh_token');
    setAccessToken(null);
    setUser(null);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      workspaceName?: string;
    }) => {
      const res = await api.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', data);

      if (res.success && res.data) {
        const { user: userData, accessToken: token, refreshToken } = res.data;
        localStorage.setItem('crm_access_token', token);
        if (refreshToken) {
          localStorage.setItem('crm_refresh_token', refreshToken);
        }
        setAccessToken(token);
        setUser(userData);
      } else {
        throw new Error(res.error || res.message || 'Registration failed');
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
