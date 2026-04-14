import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';
import type { FilterItem } from './FilterPanel';
import { makeColumn } from '@/test/fixtures';

const textCol = makeColumn({ id: 1, name: 'Title', columnType: 'text' });
const numberCol = makeColumn({ id: 2, name: 'Amount', columnType: 'number' });
const statusCol = makeColumn({
  id: 3,
  name: 'Status',
  columnType: 'status',
  config: { options: [{ label: 'Done', color: '#00c875' }, { label: 'Stuck', color: '#e2445c' }] },
});
const dropdownCol = makeColumn({
  id: 4,
  name: 'Category',
  columnType: 'dropdown',
  config: { options: [{ label: 'TypeA', color: '#aaa' }, { label: 'TypeB', color: '#bbb' }] },
});

describe('FilterPanel', () => {
  it('renders the Add filter button when there are no filters', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Add filter')).toBeDefined();
  });

  it('does not show Clear all button when there are no filters', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    expect(screen.queryByText('Clear all')).toBeNull();
  });

  it('clicking Add filter shows the column select form', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Add filter'));
    // A select with "Select column..." should appear
    expect(screen.getByText('Select column...')).toBeDefined();
  });

  it('selecting a column populates operator options', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Add filter'));

    const selects = document.querySelectorAll('select');
    // First select is the column picker
    fireEvent.change(selects[0], { target: { value: String(textCol.id) } });

    // After selecting a column, an operator select should appear with text operators
    expect(screen.getByText('Contains')).toBeDefined();
    expect(screen.getByText('Equals')).toBeDefined();
  });

  it('adding a filter calls onChange with the new filter', () => {
    const onChange = vi.fn();
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Add filter'));

    const selects = document.querySelectorAll('select');
    // Pick column
    fireEvent.change(selects[0], { target: { value: String(textCol.id) } });

    // Pick operator (now 2 selects: column + operator)
    const selects2 = document.querySelectorAll('select');
    fireEvent.change(selects2[1], { target: { value: 'contains' } });

    // Fill in value input
    const valueInput = document.querySelector('input[type="text"]')!;
    fireEvent.change(valueInput, { target: { value: 'hello' } });

    fireEvent.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      { columnId: textCol.id, operator: 'contains', value: 'hello' },
    ]);
  });

  it('shows existing filter with column name and operator label', () => {
    const filter: FilterItem = { columnId: textCol.id, operator: 'contains', value: 'foo' };
    render(<FilterPanel columns={[textCol]} filters={[filter]} onChange={vi.fn()} />);
    // Column name shown
    expect(screen.getByText('Title')).toBeDefined();
    // Operator label shown
    expect(screen.getByText('Contains')).toBeDefined();
    // Value shown
    expect(screen.getByText('foo')).toBeDefined();
  });

  it('clicking remove button on a filter calls onChange with that filter removed', () => {
    const onChange = vi.fn();
    const f1: FilterItem = { columnId: textCol.id, operator: 'contains', value: 'abc' };
    const f2: FilterItem = { columnId: numberCol.id, operator: 'equals', value: 10 };
    render(<FilterPanel columns={[textCol, numberCol]} filters={[f1, f2]} onChange={onChange} />);

    // Find the X buttons — there should be two (one per filter)
    const removeButtons = document.querySelectorAll('button[class*="ml-auto"]');
    // Click the first remove button (removes f1)
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([f2]);
  });

  it('Clear all button calls onChange with empty array', () => {
    const onChange = vi.fn();
    const filter: FilterItem = { columnId: textCol.id, operator: 'equals', value: 'x' };
    render(<FilterPanel columns={[textCol]} filters={[filter]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Clear all'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('is_empty operator hides the value input', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Add filter'));

    const selects = document.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: String(textCol.id) } });

    const selects2 = document.querySelectorAll('select');
    fireEvent.change(selects2[1], { target: { value: 'is_empty' } });

    // No text input for value should appear
    const valueInput = document.querySelector('input[type="text"]');
    expect(valueInput).toBeNull();
  });

  it('status column shows a select for value input (not a text input)', () => {
    render(<FilterPanel columns={[statusCol]} filters={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Add filter'));

    const selects = document.querySelectorAll('select');
    // Select the status column
    fireEvent.change(selects[0], { target: { value: String(statusCol.id) } });

    const selects2 = document.querySelectorAll('select');
    // Select 'equals' operator for status
    fireEvent.change(selects2[1], { target: { value: 'equals' } });

    // Value input should be a select (not text input)
    const textInput = document.querySelector('input[type="text"]');
    expect(textInput).toBeNull();

    // A third select for value should be present with status options
    const selects3 = document.querySelectorAll('select');
    expect(selects3.length).toBe(3);
    expect(screen.getByText('Done')).toBeDefined();
  });

  it('Cancel button resets the add filter form', () => {
    render(<FilterPanel columns={[textCol]} filters={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Add filter'));
    expect(screen.getByText('Select column...')).toBeDefined();

    fireEvent.click(screen.getByText('Cancel'));
    // Form should be gone, Add filter button visible again
    expect(screen.getByText('Add filter')).toBeDefined();
    expect(screen.queryByText('Select column...')).toBeNull();
  });
});
