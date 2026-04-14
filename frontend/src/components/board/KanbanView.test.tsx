import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { KanbanView } from './KanbanView';
import { makeBoard, makeItem, makeColumn, makeGroup } from '@/test/fixtures';

vi.mock('./ColumnRenderer', () => ({
  ColumnRenderer: ({ value }: any) => <span>{String(value ?? '-')}</span>,
}));
vi.mock('../common/StatusBadge', () => ({
  StatusBadge: ({ label }: any) => <span>{label}</span>,
}));

const board = makeBoard({
  columns: [
    makeColumn({
      id: 201,
      columnType: 'status',
      name: 'Status',
      config: {
        options: [
          { label: 'Not started', color: '#c4c4c4' },
          { label: 'Done', color: '#00c875' },
        ],
      },
    }),
    makeColumn({ id: 202, columnType: 'text', name: 'Notes' }),
  ],
  groups: [makeGroup({ id: 100, name: 'Group A' })],
});

const items = [
  makeItem({
    id: 1,
    groupId: 100,
    name: 'Task One',
    columnValues: [
      { id: 1, itemId: 1, columnId: 201, value: { label: 'Done', color: '#00c875' } },
    ],
  }),
  makeItem({
    id: 2,
    groupId: 100,
    name: 'Task Two',
    columnValues: [],
  }),
];

describe('KanbanView', () => {
  it('renders lane headers for each status option', () => {
    render(<KanbanView board={board} items={items} />);
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('places items with matching status in their correct lane', () => {
    render(<KanbanView board={board} items={items} />);
    // Task One has Done status — it should appear in the document
    expect(screen.getByText('Task One')).toBeInTheDocument();
  });

  it('items without a status appear in the Uncategorized lane', () => {
    render(<KanbanView board={board} items={items} />);
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('Task Two')).toBeInTheDocument();
  });

  it('empty lane shows "No items" placeholder', () => {
    render(<KanbanView board={board} items={items} />);
    // "Not started" lane has no items
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('each item card shows the item name', () => {
    render(<KanbanView board={board} items={items} />);
    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.getByText('Task Two')).toBeInTheDocument();
  });

  it('"Add item" button shows input; typing and clicking Add calls onItemCreate', () => {
    const onItemCreate = vi.fn();
    render(<KanbanView board={board} items={items} onItemCreate={onItemCreate} />);

    // Click the first "Add item" button (Done lane)
    const addButtons = screen.getAllByRole('button', { name: /add item/i });
    fireEvent.click(addButtons[0]);

    const input = screen.getByPlaceholderText('Item name...');
    fireEvent.change(input, { target: { value: 'New Task' } });

    const addBtn = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addBtn);

    expect(onItemCreate).toHaveBeenCalledWith(100, 'New Task');
  });

  it('Cancel button clears the add-item form', () => {
    const onItemCreate = vi.fn();
    render(<KanbanView board={board} items={items} onItemCreate={onItemCreate} />);

    const addButtons = screen.getAllByRole('button', { name: /add item/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByPlaceholderText('Item name...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByPlaceholderText('Item name...')).not.toBeInTheDocument();
  });
});
