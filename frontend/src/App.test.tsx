import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Stub out heavy page components
vi.mock('@/pages/LoginPage', () => ({ default: () => <div>LoginPage</div> }));
vi.mock('@/pages/BoardListPage', () => ({ default: () => <div>BoardListPage</div> }));
vi.mock('@/pages/BoardPage', () => ({ default: () => <div>BoardPage</div> }));

const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('shows loading spinner while auth is loading (ProtectedRoute)', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    renderApp('/boards');
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('redirects unauthenticated user from / to /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderApp('/');
    expect(screen.getByText('LoginPage')).toBeDefined();
  });

  it('redirects authenticated user from / to /boards', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderApp('/');
    expect(screen.getByText('BoardListPage')).toBeDefined();
  });

  it('ProtectedRoute redirects unauthenticated user to /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderApp('/boards');
    expect(screen.getByText('LoginPage')).toBeDefined();
  });

  it('ProtectedRoute renders page when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderApp('/boards');
    expect(screen.getByText('BoardListPage')).toBeDefined();
  });

  it('PublicRoute redirects authenticated user from /login to /boards', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderApp('/login');
    expect(screen.getByText('BoardListPage')).toBeDefined();
  });

  it('PublicRoute shows loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { container } = renderApp('/login');
    // Renders the spinner div (no text — just an animated element)
    expect(container.querySelector('.animate-spin')).toBeDefined();
    expect(screen.queryByText('LoginPage')).toBeNull();
  });

  it('PublicRoute shows login page for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderApp('/login');
    expect(screen.getByText('LoginPage')).toBeDefined();
  });

  it('RootRedirect shows spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { container } = renderApp('/');
    expect(container.querySelector('.animate-spin')).toBeDefined();
  });

  it('catch-all route redirects to /', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderApp('/nonexistent-route');
    // Redirects to / then to /login for unauthenticated
    expect(screen.getByText('LoginPage')).toBeDefined();
  });
});
