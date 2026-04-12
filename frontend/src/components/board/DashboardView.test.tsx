import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from './DashboardView';

const mockGet = vi.fn();
const mockPut = vi.fn();
vi.mock('@/utils/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

const MOCK_AGGREGATES = {
  totalItems: 25,
  statusCounts: {
    'Done': 10,
    'Working on it': 8,
    'Stuck': 4,
    'Not started': 3,
  },
  itemsByGroup: { 1: 15, 2: 10 },
};

const MOCK_BOARD = {
  id: 42,
  name: 'Test Board',
  workspaceId: 1,
  columns: [
    { id: 1, name: 'Status', columnType: 'status', position: 0 },
    { id: 2, name: 'Priority', columnType: 'dropdown', position: 1 },
  ],
  groups: [
    { id: 1, name: 'Sprint 1', color: '#6366f1' },
    { id: 2, name: 'Sprint 2', color: '#22c55e' },
  ],
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching aggregates', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<DashboardView board={MOCK_BOARD as any} />);
    expect(screen.getByTestId('dashboard-loading')).toBeDefined();
  });

  it('renders KPI cards with status counts', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: MOCK_AGGREGATES,
    });

    render(<DashboardView board={MOCK_BOARD as any} />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-grid')).toBeDefined();
    });

    // Should show total items KPI
    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('Total Items')).toBeDefined();
  });

  it('renders status breakdown KPIs', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: MOCK_AGGREGATES,
    });

    render(<DashboardView board={MOCK_BOARD as any} />);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeDefined();
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Working on it')).toBeDefined();
    });
  });

  it('renders items by group summary', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: MOCK_AGGREGATES,
    });

    render(<DashboardView board={MOCK_BOARD as any} />);

    await waitFor(() => {
      expect(screen.getByText('Sprint 1')).toBeDefined();
      expect(screen.getByText('Sprint 2')).toBeDefined();
    });
  });

  it('shows empty state when board has no items', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: { totalItems: 0, statusCounts: {}, itemsByGroup: {} },
    });

    render(<DashboardView board={MOCK_BOARD as any} />);

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fetches aggregates from correct endpoint', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: MOCK_AGGREGATES,
    });

    render(<DashboardView board={MOCK_BOARD as any} />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/boards/42/aggregates');
    });
  });
});
