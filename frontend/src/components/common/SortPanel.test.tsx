import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortPanel } from './SortPanel';
import type { SortRule } from './SortPanel';
import { makeColumn } from '@/test/fixtures';

const COL_A = makeColumn({ id: 1, name: 'Column A', position: 0 });
const COL_B = makeColumn({ id: 2, name: 'Column B', position: 1 });
const COL_C = makeColumn({ id: 3, name: 'Column C', position: 2 });

describe('SortPanel', () => {
  it('"Add sort" button is visible when columns are available and not all are used', () => {
    const onChange = vi.fn();
    render(<SortPanel columns={[COL_A, COL_B]} sorts={[]} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /add sort/i })).toBeInTheDocument();
  });

  it('clicking "Add sort" calls onChange with first available column + ASC', () => {
    const onChange = vi.fn();
    render(<SortPanel columns={[COL_A, COL_B]} sorts={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add sort/i }));
    expect(onChange).toHaveBeenCalledWith([{ columnId: COL_A.id, direction: 'ASC' }]);
  });

  it('"Clear all" button removes all sorts', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [
      { columnId: COL_A.id, direction: 'ASC' },
      { columnId: COL_B.id, direction: 'DESC' },
    ];
    render(<SortPanel columns={[COL_A, COL_B]} sorts={sorts} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('remove button on a sort rule removes just that sort', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [
      { columnId: COL_A.id, direction: 'ASC' },
      { columnId: COL_B.id, direction: 'DESC' },
    ];
    const { container } = render(
      <SortPanel columns={[COL_A, COL_B]} sorts={sorts} onChange={onChange} />
    );
    // Each sort row is a .bg-gray-50 div containing: moveUp, moveDown, col-select, dir-select, X
    const sortRows = container.querySelectorAll('.bg-gray-50');
    const firstRowButtons = sortRows[0].querySelectorAll('button');
    // The last button in the row is the X (remove) button
    fireEvent.click(firstRowButtons[firstRowButtons.length - 1]);
    expect(onChange).toHaveBeenCalledWith([{ columnId: COL_B.id, direction: 'DESC' }]);
  });

  it('changing direction select calls onChange with updated direction', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [{ columnId: COL_A.id, direction: 'ASC' }];
    render(<SortPanel columns={[COL_A, COL_B]} sorts={sorts} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    // First combobox is column select, second is direction select
    fireEvent.change(selects[1], { target: { value: 'DESC' } });
    expect(onChange).toHaveBeenCalledWith([{ columnId: COL_A.id, direction: 'DESC' }]);
  });

  it('changing column select calls onChange with updated column', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [{ columnId: COL_A.id, direction: 'ASC' }];
    render(<SortPanel columns={[COL_A, COL_B]} sorts={sorts} onChange={onChange} />);
    const selects = screen.getAllByRole('combobox');
    // First combobox is column select
    fireEvent.change(selects[0], { target: { value: String(COL_B.id) } });
    expect(onChange).toHaveBeenCalledWith([{ columnId: COL_B.id, direction: 'ASC' }]);
  });

  it('"Move up" button disabled for first sort, "Move down" disabled for last', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [
      { columnId: COL_A.id, direction: 'ASC' },
      { columnId: COL_B.id, direction: 'DESC' },
    ];
    render(<SortPanel columns={[COL_A, COL_B, COL_C]} sorts={sorts} onChange={onChange} />);
    const allButtons = screen.getAllByRole('button');
    const disabledButtons = allButtons.filter((b) => b.hasAttribute('disabled'));
    // moveUp on first row + moveDown on last row = at least 2 disabled
    expect(disabledButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('"Add sort" is hidden when all columns are already used as sorts', () => {
    const onChange = vi.fn();
    const sorts: SortRule[] = [
      { columnId: COL_A.id, direction: 'ASC' },
      { columnId: COL_B.id, direction: 'DESC' },
    ];
    // Only 2 columns, both used as sorts
    render(<SortPanel columns={[COL_A, COL_B]} sorts={sorts} onChange={onChange} />);
    expect(screen.queryByRole('button', { name: /add sort/i })).not.toBeInTheDocument();
  });
});
