import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('renders 12 color buttons', () => {
    render(<ColorPicker selectedColor="" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
  });

  it('calls onChange with the selected color on click', () => {
    const onChange = vi.fn();
    render(<ColorPicker selectedColor="" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('color-#579BFC'));
    expect(onChange).toHaveBeenCalledWith('#579BFC');
  });

  it('applies dark border to the currently selected color', () => {
    const { container } = render(
      <ColorPicker selectedColor="#579BFC" onChange={vi.fn()} />
    );
    const selectedBtn = container.querySelector('[data-testid="color-#579BFC"]') as HTMLElement;
    expect(selectedBtn.style.borderColor).toBe('rgb(31, 41, 55)'); // #1f2937
  });
});
