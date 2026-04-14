import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../types/index';
import api from '../utils/api';

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

const TOKEN_KEY = 'crm_access_token';
const REFRESH_KEY = 'crm_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setAccessToken(token);
      api
        .get<{ user: User }>('/auth/me')
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data.user || (res.data as any));
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            setAccessToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
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
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
      setAccessToken(token);
      setUser(userData);
    } else {
      throw new Error(res.error || res.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
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
        localStorage.setItem(TOKEN_KEY, token);
        if (refreshToken) {
          localStorage.setItem(REFRESH_KEY, refreshToken);
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
