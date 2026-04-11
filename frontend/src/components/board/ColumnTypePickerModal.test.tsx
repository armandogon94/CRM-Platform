import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnTypePickerModal } from './ColumnTypePickerModal';

describe('ColumnTypePickerModal', () => {
  it('renders all 15 column types', () => {
    render(<ColumnTypePickerModal onSelect={vi.fn()} onClose={vi.fn()} />);

    const types = [
      'Status', 'Text', 'Long Text', 'Number', 'Date',
      'Person', 'Email', 'Phone', 'Dropdown', 'Checkbox',
      'URL', 'Files', 'Formula', 'Timeline', 'Rating',
    ];
    for (const type of types) {
      expect(screen.getByText(type)).toBeDefined();
    }
  });

  it('calls onSelect with the correct type when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<ColumnTypePickerModal onSelect={onSelect} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId('column-type-status'));
    expect(onSelect).toHaveBeenCalledWith('status');
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<ColumnTypePickerModal onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('column-type-modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ColumnTypePickerModal onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
