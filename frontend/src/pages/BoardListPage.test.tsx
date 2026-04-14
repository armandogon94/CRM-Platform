import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BoardListPage from './BoardListPage';
import { makeBoard, makeWorkspace } from '@/test/fixtures';

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockRefreshBoards = vi.fn();
const mockWorkspaceContextValue = {
  workspace: makeWorkspace(),
  boards: [] as ReturnType<typeof makeBoard>[],
  refreshBoards: mockRefreshBoards,
  isLoading: false,
  selectedBoard: null,
  setSelectedBoard: vi.fn(),
};

vi.mock('@/context/WorkspaceContext', () => ({
  useWorkspace: () => mockWorkspaceContextValue,
}));

const mockApiPost = vi.fn();

vi.mock('@/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: (...args: any[]) => mockApiPost(...args),
  },
  default: {
    get: vi.fn(),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

// --- Helpers ---

function renderPage() {
  return render(
    <MemoryRouter>
      <BoardListPage />
    </MemoryRouter>
  );
}

// --- Tests ---

describe('BoardListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaceContextValue.isLoading = false;
    mockWorkspaceContextValue.boards = [];
    mockWorkspaceContextValue.workspace = makeWorkspace();
    mockRefreshBoards.mockResolvedValue(undefined);
  });

  it('shows loading spinner when isLoading is true', () => {
    mockWorkspaceContextValue.isLoading = true;
    renderPage();
    // The spinner is a div with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('shows empty state when boards is empty and not loading', () => {
    mockWorkspaceContextValue.boards = [];
    mockWorkspaceContextValue.isLoading = false;
    renderPage();
    expect(screen.getByText('No boards yet')).toBeInTheDocument();
  });

  it('renders board cards with name and description', () => {
    mockWorkspaceContextValue.boards = [
      makeBoard({ id: 1, name: 'Sales Pipeline', description: 'Track all deals' }),
      makeBoard({ id: 2, name: 'Marketing', description: null }),
    ];
    renderPage();
    expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Track all deals')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('clicking a board card navigates to /boards/:id', () => {
    mockWorkspaceContextValue.boards = [
      makeBoard({ id: 42, name: 'Deals Board' }),
    ];
    renderPage();
    fireEvent.click(screen.getByText('Deals Board'));
    expect(mockNavigate).toHaveBeenCalledWith('/boards/42');
  });

  it('"New Board" button opens the create dialog', () => {
    renderPage();
    // Header "New Board" button
    fireEvent.click(screen.getByRole('button', { name: /new board/i }));
    expect(screen.getByText('Create New Board')).toBeInTheDocument();
  });

  it('create dialog renders the board name input field', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /new board/i }));
    // Dialog contains "Board Name" label text and the placeholder input
    expect(screen.getByText('Board Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/sales pipeline/i)).toBeInTheDocument();
  });

  it('submitting create dialog calls api.post and refreshes boards', async () => {
    mockApiPost.mockResolvedValue({ success: true, data: { board: makeBoard({ id: 99 }) } });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /new board/i }));

    const nameInput = screen.getByPlaceholderText(/sales pipeline/i);
    fireEvent.change(nameInput, { target: { value: 'My New Board' } });

    // The dialog's submit button is the one inside the form
    const submitButtons = screen.getAllByRole('button', { name: /create board/i });
    const submitButton = submitButtons[submitButtons.length - 1];
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/boards',
        expect.objectContaining({ name: 'My New Board', workspaceId: 1 })
      );
      expect(mockRefreshBoards).toHaveBeenCalled();
    });
  });
});
