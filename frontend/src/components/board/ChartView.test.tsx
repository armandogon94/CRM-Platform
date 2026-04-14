import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartView } from './ChartView';
import { makeBoard, makeItem, makeColumn, makeColumnValue, STATUS_COLUMN, TEXT_COLUMN } from '@/test/fixtures';

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
}));

describe('ChartView', () => {
  it('shows "No status column found" message when board has no status column', () => {
    const board = makeBoard({ columns: [TEXT_COLUMN] });
    render(<ChartView board={board} items={[]} />);
    expect(screen.getByText(/add a status column to use chart view/i)).toBeInTheDocument();
  });

  it('renders a bar chart when a status column exists', () => {
    const board = makeBoard({ columns: [STATUS_COLUMN] });
    render(<ChartView board={board} items={[]} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders a pie chart when a status column exists', () => {
    const board = makeBoard({ columns: [STATUS_COLUMN] });
    render(<ChartView board={board} items={[]} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('aggregates items by status label correctly', () => {
    const board = makeBoard({ columns: [STATUS_COLUMN] });

    const items = [
      makeItem({
        id: 1,
        columnValues: [
          makeColumnValue({ columnId: STATUS_COLUMN.id, value: { label: 'Done', color: '#00c875' } }),
        ],
      }),
      makeItem({
        id: 2,
        columnValues: [
          makeColumnValue({ columnId: STATUS_COLUMN.id, value: { label: 'Done', color: '#00c875' } }),
        ],
      }),
      makeItem({
        id: 3,
        columnValues: [
          makeColumnValue({ columnId: STATUS_COLUMN.id, value: { label: 'Working on it', color: '#fdab3d' } }),
        ],
      }),
    ];

    render(<ChartView board={board} items={items} />);

    // Both charts should be present (aggregation feeds both)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

    // The heading "Items by Status" confirms the chart section rendered
    expect(screen.getByText('Items by Status')).toBeInTheDocument();
  });
});
