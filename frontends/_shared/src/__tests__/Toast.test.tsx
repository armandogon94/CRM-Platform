// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../components/common/ToastProvider';

// Minimal consumer that exposes the hook surface to the test — avoids
// cramming hook-related helper logic into each case, so each `it` reads
// as a direct scenario without shared-helper indirection.
function Harness({ onReady }: { onReady: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast();
  React.useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

function renderWithProvider() {
  let api!: ReturnType<typeof useToast>;
  render(
    <ToastProvider>
      <Harness onReady={(h) => (api = h)} />
    </ToastProvider>
  );
  // The useEffect above runs on mount; api is populated synchronously
  // after render() returns because RTL flushes effects.
  return () => api;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('useToast() + ToastProvider', () => {
    it('renders a visible toast when show() is called', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Hello' });
      });
      expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('renders the optional description alongside the title', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Heads up', description: 'Details here.' });
      });
      expect(screen.getByText('Heads up')).toBeTruthy();
      expect(screen.getByText('Details here.')).toBeTruthy();
    });

    it('stacks multiple toasts so all are visible at once', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'First' });
        getApi().show({ variant: 'info', title: 'Second' });
        getApi().show({ variant: 'info', title: 'Third' });
      });
      expect(screen.getByText('First')).toBeTruthy();
      expect(screen.getByText('Second')).toBeTruthy();
      expect(screen.getByText('Third')).toBeTruthy();
    });
  });

  describe('accessibility — ARIA role by variant', () => {
    it('error variant uses role="alert"', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'error', title: 'Broke' });
      });
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('Broke'))).toBe(true);
    });

    it('warning variant uses role="alert"', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'warning', title: 'Careful' });
      });
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('Careful'))).toBe(true);
    });

    it('success variant uses role="status"', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'success', title: 'Saved' });
      });
      const statuses = screen.getAllByRole('status');
      expect(statuses.some((el) => el.textContent?.includes('Saved'))).toBe(true);
    });

    it('info variant uses role="status"', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'FYI' });
      });
      const statuses = screen.getAllByRole('status');
      expect(statuses.some((el) => el.textContent?.includes('FYI'))).toBe(true);
    });
  });

  describe('dismiss affordance', () => {
    it('dismiss button exposes aria-label="Dismiss notification"', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Dismissable' });
      });
      const btn = screen.getByRole('button', { name: /dismiss notification/i });
      expect(btn).toBeTruthy();
    });

    it('clicking the dismiss button removes the toast from the DOM', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Removable' });
      });
      const btn = screen.getByRole('button', { name: /dismiss notification/i });
      await user.click(btn);
      expect(screen.queryByText('Removable')).toBeNull();
    });
  });

  describe('auto-close behavior', () => {
    it('auto-closes after the default 5000ms', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Ephemeral' });
      });
      expect(screen.getByText('Ephemeral')).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByText('Ephemeral')).toBeNull();
    });

    it('honors a custom autoCloseMs duration', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Quick', autoCloseMs: 1000 });
      });
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(screen.getByText('Quick')).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByText('Quick')).toBeNull();
    });

    it('persists when autoCloseMs is null (manual dismiss only)', () => {
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'error', title: 'Sticky', autoCloseMs: null });
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText('Sticky')).toBeTruthy();
    });
  });

  describe('keyboard dismissal', () => {
    it('Escape key dismisses the most-recent toast', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const getApi = renderWithProvider();
      act(() => {
        getApi().show({ variant: 'info', title: 'Older', autoCloseMs: null });
        getApi().show({ variant: 'info', title: 'Newest', autoCloseMs: null });
      });
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Newest')).toBeNull();
      expect(screen.getByText('Older')).toBeTruthy();
    });
  });

  describe('useToast outside ToastProvider', () => {
    it('throws a helpful error if called without a provider', () => {
      // Silence React's error-boundary console noise during this negative test.
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Unwrapped() {
        useToast();
        return null;
      }
      expect(() => render(<Unwrapped />)).toThrow(/ToastProvider/);
      err.mockRestore();
    });
  });
});
