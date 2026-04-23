// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastProvider';
import BoardListPage from '../pages/BoardListPage';

/**
 * B2: BoardListPage error-toast wiring.
 *
 * Before Slice 20 B2: the "New Board" dialog's catch block was
 *   `catch { // Handle error silently }` — so network failures,
 *   400 validation errors, and 403 cross-workspace rejections were
 *   all invisible to the user. Paired with the missing backend flat
 *   route (A2.5), every board-create attempt was silently 404-ing.
 *
 * After B2: every failure path emits a toast. Success path behavior
 * (close dialog, reset form, refresh boards) is unchanged.
 */

// ── Mocks ────────────────────────────────────────────────────────────────

const mockBoardsCreate = vi.fn();
vi.mock('../utils/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    items: {
      create: vi.fn(),
      update: vi.fn(),
      updateValues: vi.fn(),
      delete: vi.fn(),
    },
    boards: {
      create: (...args: unknown[]) => mockBoardsCreate(...args),
    },
  };
  return { api: mockApi, default: mockApi, configureApi: vi.fn() };
});

const mockRefreshBoards = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    boards: [],
    isLoading: false,
    workspace: { id: 7, name: 'TestWs', slug: 'test-ws', description: null },
    refreshBoards: mockRefreshBoards,
  }),
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// MainLayout pulls a bunch of context (auth, sidebar, notifications) that
// isn't under test for B2. Stub it to a passthrough so we can focus on
// the dialog behaviour.
vi.mock('../components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <BoardListPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

async function openDialogAndFill(user: ReturnType<typeof userEvent.setup>) {
  // There are two "New Board" buttons (header + empty-state); clicking
  // either opens the dialog. Use the top-right header button.
  await user.click(screen.getByRole('button', { name: /^new board$/i }));
  await user.type(screen.getByPlaceholderText(/sales pipeline/i), 'Deals Q2');
  await user.type(screen.getByPlaceholderText(/what is this board for/i), 'Second-quarter pipeline');
}

// Resolve the submit-type "Create Board" button (distinguishes it from
// the empty-state "Create Board" that just opens the dialog).
function submitCreateButton(): HTMLElement {
  const submit = document.querySelector(
    'form button[type="submit"]'
  ) as HTMLElement | null;
  if (!submit) throw new Error('Submit button not found — is the dialog open?');
  return submit;
}

describe('BoardListPage — create flow error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success path (regression guard)', () => {
    it('closes the dialog and refreshes boards on success', async () => {
      const user = userEvent.setup();
      mockBoardsCreate.mockResolvedValue({
        success: true,
        data: { board: { id: 42, name: 'Deals Q2', workspaceId: 7, boardType: 'main' } },
      });

      renderPage();
      await openDialogAndFill(user);
      // Two "Create Board" buttons when dialog is open (empty-state +
      // form submit). The submit is the last one in DOM order.
      await user.click(submitCreateButton());

      expect(mockBoardsCreate).toHaveBeenCalledWith({
        name: 'Deals Q2',
        description: 'Second-quarter pipeline',
        workspaceId: 7,
        boardType: 'main',
      });
      expect(mockRefreshBoards).toHaveBeenCalledTimes(1);
      // Dialog closes — "Create New Board" heading disappears.
      expect(screen.queryByText(/create new board/i)).toBeNull();
    });
  });

  describe('server-returned error (success: false)', () => {
    it('emits a toast with the server error message', async () => {
      const user = userEvent.setup();
      mockBoardsCreate.mockResolvedValue({
        success: false,
        error: 'A board with this name already exists',
      });

      renderPage();
      await openDialogAndFill(user);
      // Two "Create Board" buttons when dialog is open (empty-state +
      // form submit). The submit is the last one in DOM order.
      await user.click(submitCreateButton());

      expect(
        screen.getByText(/a board with this name already exists/i)
      ).toBeTruthy();
    });

    it('keeps the dialog open and preserves typed values', async () => {
      const user = userEvent.setup();
      mockBoardsCreate.mockResolvedValue({
        success: false,
        error: 'Validation failed',
      });

      renderPage();
      await openDialogAndFill(user);
      // Two "Create Board" buttons when dialog is open (empty-state +
      // form submit). The submit is the last one in DOM order.
      await user.click(submitCreateButton());

      // Dialog heading still visible.
      expect(screen.getByText(/create new board/i)).toBeTruthy();
      // Typed values preserved — user doesn't have to re-enter them.
      expect(screen.getByDisplayValue('Deals Q2')).toBeTruthy();
      expect(screen.getByDisplayValue('Second-quarter pipeline')).toBeTruthy();
      // refreshBoards NOT called on failure.
      expect(mockRefreshBoards).not.toHaveBeenCalled();
    });
  });

  describe('network rejection (fetch throws)', () => {
    it('emits a generic error toast when the promise rejects', async () => {
      const user = userEvent.setup();
      mockBoardsCreate.mockRejectedValue(new Error('Network down'));

      renderPage();
      await openDialogAndFill(user);
      // Two "Create Board" buttons when dialog is open (empty-state +
      // form submit). The submit is the last one in DOM order.
      await user.click(submitCreateButton());

      // Dialog stays open, error surfaces as toast rather than silent
      // swallow. Message need not quote the raw Error — a user-facing
      // "Could not create board" string is sufficient.
      expect(screen.getByText(/could not create board/i)).toBeTruthy();
      expect(mockRefreshBoards).not.toHaveBeenCalled();
    });
  });

  describe('silent-catch removal', () => {
    it('has no empty catch blocks after B2 — every failure is observable', async () => {
      // This is an integration-level proof: if the catch block were still
      // empty, the network-rejection test above would fail to find any
      // toast. Capturing it explicitly so the regression is named.
      const user = userEvent.setup();
      mockBoardsCreate.mockRejectedValue(new Error('Failed'));

      renderPage();
      await openDialogAndFill(user);
      // Two "Create Board" buttons when dialog is open (empty-state +
      // form submit). The submit is the last one in DOM order.
      await user.click(submitCreateButton());

      // Toast surface has at least one message — failure was NOT swallowed.
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});
