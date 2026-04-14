import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnEditor } from './ColumnEditor';
import { makeColumn } from '@/test/fixtures';

describe('ColumnEditor', () => {
  describe('text type', () => {
    it('renders a text input', () => {
      const col = makeColumn({ columnType: 'text' });
      render(<ColumnEditor column={col} value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDefined();
      expect((input as HTMLInputElement).type).toBe('text');
    });

    it('calls onChange when typing', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'text' });
      render(<ColumnEditor column={col} value="" onChange={onChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      expect(onChange).toHaveBeenCalledWith('hello');
    });

    it('calls onBlur when Enter key is pressed', () => {
      const onBlur = vi.fn();
      const col = makeColumn({ columnType: 'text' });
      render(<ColumnEditor column={col} value="" onChange={vi.fn()} onBlur={onBlur} />);
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onBlur).toHaveBeenCalled();
    });

    it('calls onBlur when input loses focus', () => {
      const onBlur = vi.fn();
      const col = makeColumn({ columnType: 'text' });
      render(<ColumnEditor column={col} value="test" onChange={vi.fn()} onBlur={onBlur} />);
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('long_text type', () => {
    it('renders a textarea', () => {
      const col = makeColumn({ columnType: 'long_text' });
      render(<ColumnEditor column={col} value="" onChange={vi.fn()} />);
      const textarea = document.querySelector('textarea');
      expect(textarea).not.toBeNull();
    });

    it('calls onChange when typing in textarea', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'long_text' });
      render(<ColumnEditor column={col} value="" onChange={onChange} />);
      const textarea = document.querySelector('textarea')!;
      fireEvent.change(textarea, { target: { value: 'long text' } });
      expect(onChange).toHaveBeenCalledWith('long text');
    });
  });

  describe('number type', () => {
    it('renders a number input', () => {
      const col = makeColumn({ columnType: 'number', config: {} });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).not.toBeNull();
    });

    it('calls onChange with a Number when typing', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'number', config: {} });
      render(<ColumnEditor column={col} value={null} onChange={onChange} />);
      const input = document.querySelector('input[type="number"]')!;
      fireEvent.change(input, { target: { value: '42' } });
      expect(onChange).toHaveBeenCalledWith(42);
    });

    it('calls onChange with null when cleared', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'number', config: {} });
      render(<ColumnEditor column={col} value={10} onChange={onChange} />);
      const input = document.querySelector('input[type="number"]')!;
      fireEvent.change(input, { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('date type', () => {
    it('renders a date input', () => {
      const col = makeColumn({ columnType: 'date' });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      const input = document.querySelector('input[type="date"]');
      expect(input).not.toBeNull();
    });

    it('calls onChange with date string when changed', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'date' });
      render(<ColumnEditor column={col} value={null} onChange={onChange} />);
      const input = document.querySelector('input[type="date"]')!;
      fireEvent.change(input, { target: { value: '2026-04-14' } });
      expect(onChange).toHaveBeenCalledWith('2026-04-14');
    });
  });

  describe('status type', () => {
    it('renders clickable option buttons from config.options', () => {
      const col = makeColumn({
        columnType: 'status',
        config: {
          options: [
            { label: 'Done', color: '#00c875' },
            { label: 'Stuck', color: '#e2445c' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      expect(screen.getByText('Done')).toBeDefined();
      expect(screen.getByText('Stuck')).toBeDefined();
    });

    it('calls onChange with status value and onBlur when option clicked', () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const col = makeColumn({
        columnType: 'status',
        config: {
          options: [
            { label: 'Done', color: '#00c875' },
            { label: 'Stuck', color: '#e2445c' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={onChange} onBlur={onBlur} />);
      fireEvent.click(screen.getByText('Done'));
      expect(onChange).toHaveBeenCalledWith({ label: 'Done', color: '#00c875' });
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('dropdown type (single)', () => {
    it('renders a select element with options', () => {
      const col = makeColumn({
        columnType: 'dropdown',
        config: {
          multi: false,
          options: [
            { label: 'Option A', color: '#aaa' },
            { label: 'Option B', color: '#bbb' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      const select = document.querySelector('select');
      expect(select).not.toBeNull();
      expect(screen.getByText('Option A')).toBeDefined();
      expect(screen.getByText('Option B')).toBeDefined();
    });

    it('calls onChange with selected option object when changed', () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const col = makeColumn({
        columnType: 'dropdown',
        config: {
          multi: false,
          options: [
            { label: 'Option A', color: '#aaa' },
            { label: 'Option B', color: '#bbb' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={onChange} onBlur={onBlur} />);
      const select = document.querySelector('select')!;
      fireEvent.change(select, { target: { value: 'Option A' } });
      expect(onChange).toHaveBeenCalledWith({ label: 'Option A', color: '#aaa' });
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('dropdown type (multi)', () => {
    it('renders checkbox-style buttons for multi dropdown', () => {
      const col = makeColumn({
        columnType: 'dropdown',
        config: {
          multi: true,
          options: [
            { label: 'Tag 1', color: '#111' },
            { label: 'Tag 2', color: '#222' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      expect(screen.getByText('Tag 1')).toBeDefined();
      expect(screen.getByText('Tag 2')).toBeDefined();
    });

    it('calls onChange adding selected option when toggled on', () => {
      const onChange = vi.fn();
      const col = makeColumn({
        columnType: 'dropdown',
        config: {
          multi: true,
          options: [
            { label: 'Tag 1', color: '#111' },
            { label: 'Tag 2', color: '#222' },
          ],
        },
      });
      render(<ColumnEditor column={col} value={null} onChange={onChange} />);
      fireEvent.click(screen.getByText('Tag 1'));
      expect(onChange).toHaveBeenCalledWith([{ label: 'Tag 1', color: '#111' }]);
    });

    it('calls onChange removing option when toggled off', () => {
      const onChange = vi.fn();
      const col = makeColumn({
        columnType: 'dropdown',
        config: {
          multi: true,
          options: [
            { label: 'Tag 1', color: '#111' },
            { label: 'Tag 2', color: '#222' },
          ],
        },
      });
      // Start with Tag 1 selected
      render(
        <ColumnEditor
          column={col}
          value={[{ label: 'Tag 1', color: '#111' }]}
          onChange={onChange}
        />
      );
      // Click Tag 1 to deselect
      fireEvent.click(screen.getByText('Tag 1'));
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('checkbox type', () => {
    it('renders a toggle button', () => {
      const col = makeColumn({ columnType: 'checkbox' });
      render(<ColumnEditor column={col} value={false} onChange={vi.fn()} />);
      // The checkbox is a button element
      const btn = document.querySelector('button');
      expect(btn).not.toBeNull();
    });

    it('calls onChange with true and onBlur when unchecked is clicked', () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const col = makeColumn({ columnType: 'checkbox' });
      render(<ColumnEditor column={col} value={false} onChange={onChange} onBlur={onBlur} />);
      const btn = document.querySelector('button')!;
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(true);
      expect(onBlur).toHaveBeenCalled();
    });

    it('calls onChange with false when checked is clicked', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'checkbox' });
      render(<ColumnEditor column={col} value={true} onChange={onChange} />);
      const btn = document.querySelector('button')!;
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('email type', () => {
    it('renders an email input', () => {
      const col = makeColumn({ columnType: 'email' });
      render(<ColumnEditor column={col} value="" onChange={vi.fn()} />);
      const input = document.querySelector('input[type="email"]');
      expect(input).not.toBeNull();
    });

    it('calls onChange when typing email', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'email' });
      render(<ColumnEditor column={col} value="" onChange={onChange} />);
      const input = document.querySelector('input[type="email"]')!;
      fireEvent.change(input, { target: { value: 'user@example.com' } });
      expect(onChange).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('phone type', () => {
    it('renders a tel input', () => {
      const col = makeColumn({ columnType: 'phone' });
      render(<ColumnEditor column={col} value="" onChange={vi.fn()} />);
      const input = document.querySelector('input[type="tel"]');
      expect(input).not.toBeNull();
    });

    it('calls onChange when typing phone number', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'phone' });
      render(<ColumnEditor column={col} value="" onChange={onChange} />);
      const input = document.querySelector('input[type="tel"]')!;
      fireEvent.change(input, { target: { value: '555-1234' } });
      expect(onChange).toHaveBeenCalledWith('555-1234');
    });
  });

  describe('rating type', () => {
    it('renders star buttons (default max 5)', () => {
      const col = makeColumn({ columnType: 'rating', config: { max: 5 } });
      render(<ColumnEditor column={col} value={0} onChange={vi.fn()} />);
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBe(5);
    });

    it('calls onChange with star index + 1 when a star is clicked', () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const col = makeColumn({ columnType: 'rating', config: { max: 5 } });
      render(<ColumnEditor column={col} value={0} onChange={onChange} onBlur={onBlur} />);
      const buttons = document.querySelectorAll('button');
      // Click third star (index 2 → value 3)
      fireEvent.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(3);
      expect(onBlur).toHaveBeenCalled();
    });

    it('calls onChange with 0 when the currently-selected star is clicked (toggle off)', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'rating', config: { max: 5 } });
      // Current rating = 3, click 3rd star (index 2) to deselect
      render(<ColumnEditor column={col} value={3} onChange={onChange} />);
      const buttons = document.querySelectorAll('button');
      fireEvent.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('url type', () => {
    it('renders a url input', () => {
      const col = makeColumn({ columnType: 'url' });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} />);
      const input = document.querySelector('input[type="url"]');
      expect(input).not.toBeNull();
    });

    it('calls onChange when typing a URL', () => {
      const onChange = vi.fn();
      const col = makeColumn({ columnType: 'url' });
      render(<ColumnEditor column={col} value={null} onChange={onChange} />);
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.change(input, { target: { value: 'https://example.com' } });
      expect(onChange).toHaveBeenCalledWith('https://example.com');
    });

    it('calls onBlur on Enter key', () => {
      const onBlur = vi.fn();
      const col = makeColumn({ columnType: 'url' });
      render(<ColumnEditor column={col} value={null} onChange={vi.fn()} onBlur={onBlur} />);
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onBlur).toHaveBeenCalled();
    });
  });
});
