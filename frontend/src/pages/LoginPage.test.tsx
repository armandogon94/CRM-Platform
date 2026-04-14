import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    register: vi.fn(),
    accessToken: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email field, password field, and submit button', () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('typing into fields updates their values', () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/you@company\.com/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('secret');
  });

  it('submitting form calls login with correct email and password', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
      target: { value: 'admin@crm.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@crm.com', 'admin123');
    });
  });

  it('navigates to /boards on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
      target: { value: 'admin@crm.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/boards');
    });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
      target: { value: 'admin@crm.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('disables submit button and shows "Signing in..." while login is pending', async () => {
    // Login resolves after a tick so we can catch the loading state
    let resolveLogin: () => void;
    mockLogin.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
      target: { value: 'admin@crm.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'admin123' },
    });
    fireEvent.click(screen.getByRole('button'));

    // Button should now be disabled and show loading text
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/signing in/i);
    });

    // Clean up: resolve the promise
    resolveLogin!();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/boards');
    });
  });
});
