import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalendarView } from './CalendarView';
import { makeBoard, makeItem, makeColumn, makeGroup } from '@/test/fixtures';

// Fixed date: March 15, 2024
const FIXED_DATE = new Date('2024-03-15T12:00:00');

const boardWithNoDate = makeBoard({
  columns: [makeColumn({ id: 202, columnType: 'text', name: 'Notes' })],
  groups: [makeGroup({ id: 100 })],
});

const boardWithDate = makeBoard({
  columns: [makeColumn({ id: 203, columnType: 'date', name: 'Due Date' })],
  groups: [makeGroup({ id: 100, color: '#579BFC' })],
});

const itemsWithDate = [
  makeItem({
    id: 1,
    groupId: 100,
    name: 'My Task',
    columnValues: [
      { id: 1, itemId: 1, columnId: 203, value: { date: '2024-03-15T12:00:00' } },
    ],
  }),
];

describe('CalendarView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "No date column found" when board has no date column', () => {
    render(<CalendarView board={boardWithNoDate} items={[]} />);
    expect(
      screen.getByText(/no date column found/i)
    ).toBeInTheDocument();
  });

  it('renders current month and year in the header', () => {
    render(<CalendarView board={boardWithDate} items={[]} />);
    expect(screen.getByText('March 2024')).toBeInTheDocument();
  });

  it('renders 7 day-of-week labels (Sun through Sat)', () => {
    render(<CalendarView board={boardWithDate} items={[]} />);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('renders day numbers for the current month', () => {
    render(<CalendarView board={boardWithDate} items={[]} />);
    // March has 31 days — spot-check a few
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('31').length).toBeGreaterThanOrEqual(1);
  });

  it('"Next month" button changes the displayed month', () => {
    render(<CalendarView board={boardWithDate} items={[]} />);
    expect(screen.getByText('March 2024')).toBeInTheDocument();

    // ChevronRight button is the next-month button (last of the three header buttons)
    const buttons = screen.getAllByRole('button');
    // Header buttons order: prev (<), Today, next (>)
    const nextBtn = buttons.find((btn) => {
      // It's a small icon button — aria-label may not exist, use position
      // The next button is rendered after "Today"
      return btn.textContent === '' && btn !== buttons[0];
    });
    // Fallback: get all buttons, the next-month one is the one after "Today"
    const todayBtn = screen.getByRole('button', { name: /today/i });
    const allButtons = screen.getAllByRole('button');
    const todayIdx = allButtons.indexOf(todayBtn);
    const nextMonthBtn = allButtons[todayIdx + 1];

    fireEvent.click(nextMonthBtn);
    expect(screen.getByText('April 2024')).toBeInTheDocument();
  });

  it('"Today" button resets to current month after navigating away', () => {
    render(<CalendarView board={boardWithDate} items={[]} />);

    const todayBtn = screen.getByRole('button', { name: /today/i });
    const allButtons = screen.getAllByRole('button');
    const todayIdx = allButtons.indexOf(todayBtn);
    const nextMonthBtn = allButtons[todayIdx + 1];

    // Navigate to April
    fireEvent.click(nextMonthBtn);
    expect(screen.getByText('April 2024')).toBeInTheDocument();

    // Click Today → back to March 2024
    fireEvent.click(todayBtn);
    expect(screen.getByText('March 2024')).toBeInTheDocument();
  });

  it('clicking a day cell opens detail panel; clicking Close hides it', () => {
    render(<CalendarView board={boardWithDate} items={itemsWithDate} />);

    // Click on day 15 (March 15 has our task)
    const dayButtons = screen.getAllByRole('button');
    // Find the button whose text includes "15" and is a calendar cell
    // Calendar cells are buttons that contain a day number span
    const day15Btn = dayButtons.find(
      (btn) =>
        btn.querySelector('span') &&
        btn.querySelector('span')!.textContent === '15' &&
        btn !== screen.getByRole('button', { name: /today/i }) &&
        btn !== screen.getAllByRole('button')[0]
    );

    expect(day15Btn).toBeDefined();
    fireEvent.click(day15Btn!);

    // Detail panel should show the selected day's formatted date
    expect(screen.getByText(/friday, march 15, 2024/i)).toBeInTheDocument();

    // Close the panel
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByText(/friday, march 15, 2024/i)).not.toBeInTheDocument();
  });
});
