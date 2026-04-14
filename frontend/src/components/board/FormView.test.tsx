import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormView } from './FormView';
import { makeBoard, STATUS_COLUMN, TEXT_COLUMN } from '@/test/fixtures';

vi.mock('./ColumnEditor', () => ({
  ColumnEditor: ({ column }: any) => <input data-testid={`editor-${column.id}`} />,
}));

const board = makeBoard({
  columns: [STATUS_COLUMN, TEXT_COLUMN],
});

describe('FormView', () => {
  it('renders an input for item name (required field)', () => {
    render(<FormView board={board} onSubmit={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText(/enter item name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toBeRequired();
  });

  it('renders a ColumnEditor for each column', () => {
    render(<FormView board={board} onSubmit={vi.fn()} />);
    expect(screen.getByTestId(`editor-${STATUS_COLUMN.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`editor-${TEXT_COLUMN.id}`)).toBeInTheDocument();
  });

  it('submit with empty name does NOT call onSubmit', () => {
    const onSubmit = vi.fn();
    render(<FormView board={board} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /create item/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submit with a name calls onSubmit(name, values)', () => {
    const onSubmit = vi.fn();
    render(<FormView board={board} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText(/enter item name/i), {
      target: { value: 'My New Item' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create item/i }));
    expect(onSubmit).toHaveBeenCalledWith('My New Item', {});
  });

  it('success message appears after submit and form resets', () => {
    const onSubmit = vi.fn();
    render(<FormView board={board} onSubmit={onSubmit} />);

    const nameInput = screen.getByPlaceholderText(/enter item name/i);
    fireEvent.change(nameInput, { target: { value: 'New Task' } });
    fireEvent.click(screen.getByRole('button', { name: /create item/i }));

    // Success message appears synchronously after submit
    expect(screen.getByText(/item created successfully/i)).toBeInTheDocument();
    // Form name input should be reset to empty
    expect(nameInput).toHaveValue('');
  });
});
