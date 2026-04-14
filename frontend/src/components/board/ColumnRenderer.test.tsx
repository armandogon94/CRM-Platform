import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColumnRenderer } from './ColumnRenderer';
import { makeColumn } from '@/test/fixtures';

// ---- null / undefined / empty string guard ----

describe('ColumnRenderer — null/empty guard', () => {
  it('renders "-" for null value', () => {
    const col = makeColumn({ columnType: 'text' });
    render(<ColumnRenderer column={col} value={null} />);
    expect(screen.getByText('-')).toBeDefined();
  });

  it('renders "-" for undefined value', () => {
    const col = makeColumn({ columnType: 'text' });
    render(<ColumnRenderer column={col} value={undefined} />);
    expect(screen.getByText('-')).toBeDefined();
  });

  it('renders "-" for empty string value', () => {
    const col = makeColumn({ columnType: 'text' });
    render(<ColumnRenderer column={col} value="" />);
    expect(screen.getByText('-')).toBeDefined();
  });
});

// ---- text ----

describe('ColumnRenderer — text', () => {
  it('renders the text value', () => {
    const col = makeColumn({ columnType: 'text' });
    render(<ColumnRenderer column={col} value="Hello World" />);
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('truncates long text in compact mode', () => {
    const col = makeColumn({ columnType: 'text' });
    const longText = 'A'.repeat(40);
    render(<ColumnRenderer column={col} value={longText} compact />);
    // truncated to 30 chars + "..."
    expect(screen.getByText('A'.repeat(30) + '...')).toBeDefined();
  });
});

// ---- long_text ----

describe('ColumnRenderer — long_text', () => {
  it('renders long_text value', () => {
    const col = makeColumn({ columnType: 'long_text' });
    render(<ColumnRenderer column={col} value="Some long text here" />);
    expect(screen.getByText('Some long text here')).toBeDefined();
  });
});

// ---- number ----

describe('ColumnRenderer — number', () => {
  it('renders a plain number', () => {
    const col = makeColumn({ columnType: 'number', config: {} });
    render(<ColumnRenderer column={col} value={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders "-" for NaN input', () => {
    const col = makeColumn({ columnType: 'number', config: {} });
    render(<ColumnRenderer column={col} value="not-a-number" />);
    expect(screen.getByText('-')).toBeDefined();
  });

  it('renders percentage format', () => {
    const col = makeColumn({ columnType: 'number', config: { format: 'percentage' } });
    render(<ColumnRenderer column={col} value={75} />);
    expect(screen.getByText('75%')).toBeDefined();
  });
});

// ---- status ----

describe('ColumnRenderer — status', () => {
  it('renders the status label', () => {
    const col = makeColumn({ columnType: 'status' });
    render(<ColumnRenderer column={col} value={{ label: 'Done', color: '#00c875' }} />);
    expect(screen.getByText('Done')).toBeDefined();
  });

  it('renders "-" when status label is empty', () => {
    const col = makeColumn({ columnType: 'status' });
    render(<ColumnRenderer column={col} value={{ label: '', color: '#00c875' }} />);
    expect(screen.getByText('-')).toBeDefined();
  });
});

// ---- date ----

describe('ColumnRenderer — date', () => {
  it('renders a formatted date from string', () => {
    const col = makeColumn({ columnType: 'date', config: { include_time: false } });
    // Use a date with time so timezone offsets don't shift the displayed day
    render(<ColumnRenderer column={col} value="2024-03-20T12:00:00" />);
    expect(screen.getByText('Mar 20, 2024')).toBeDefined();
  });

  it('renders a formatted date from object with .date field', () => {
    const col = makeColumn({ columnType: 'date', config: { include_time: false } });
    render(<ColumnRenderer column={col} value={{ date: '2024-06-15T12:00:00' }} />);
    expect(screen.getByText('Jun 15, 2024')).toBeDefined();
  });
});

// ---- person ----

describe('ColumnRenderer — person', () => {
  it('renders person initials or name for a single person object', () => {
    const col = makeColumn({ columnType: 'person' });
    render(<ColumnRenderer column={col} value={[{ id: 1, name: 'Alice Smith' }]} />);
    // PersonAvatar renders initials "AS" in the avatar div
    expect(screen.getByText('AS')).toBeDefined();
  });

  it('renders person name as string', () => {
    const col = makeColumn({ columnType: 'person' });
    render(<ColumnRenderer column={col} value={['Bob Jones']} />);
    expect(screen.getByText('BJ')).toBeDefined();
  });
});

// ---- email ----

describe('ColumnRenderer — email', () => {
  it('renders an email link', () => {
    const col = makeColumn({ columnType: 'email' });
    render(<ColumnRenderer column={col} value="test@example.com" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('mailto:test@example.com');
    expect(screen.getByText('test@example.com')).toBeDefined();
  });
});

// ---- phone ----

describe('ColumnRenderer — phone', () => {
  it('renders a tel link with the phone number', () => {
    const col = makeColumn({ columnType: 'phone' });
    render(<ColumnRenderer column={col} value="+1234567890" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('tel:+1234567890');
    expect(screen.getByText('+1234567890')).toBeDefined();
  });
});

// ---- dropdown ----

describe('ColumnRenderer — dropdown', () => {
  it('renders dropdown option labels', () => {
    const col = makeColumn({ columnType: 'dropdown' });
    render(
      <ColumnRenderer
        column={col}
        value={[{ label: 'Option A', color: '#579BFC' }]}
      />
    );
    expect(screen.getByText('Option A')).toBeDefined();
  });
});

// ---- checkbox ----

describe('ColumnRenderer — checkbox', () => {
  it('renders a checked checkbox for true', () => {
    const col = makeColumn({ columnType: 'checkbox' });
    const { container } = render(<ColumnRenderer column={col} value={true} />);
    // checked state: blue rounded div with Check icon
    const bluebox = container.querySelector('.bg-blue-600');
    expect(bluebox).toBeTruthy();
  });

  it('renders an unchecked checkbox for false', () => {
    const col = makeColumn({ columnType: 'checkbox' });
    const { container } = render(<ColumnRenderer column={col} value={false} />);
    // unchecked: bordered div without bg-blue-600
    const borderBox = container.querySelector('.border-gray-300');
    expect(borderBox).toBeTruthy();
  });
});

// ---- url ----

describe('ColumnRenderer — url', () => {
  it('renders a URL as an anchor with target=_blank', () => {
    const col = makeColumn({ columnType: 'url' });
    render(<ColumnRenderer column={col} value="https://example.com" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders display text from object value', () => {
    const col = makeColumn({ columnType: 'url' });
    render(<ColumnRenderer column={col} value={{ url: 'https://example.com', text: 'Example' }} />);
    expect(screen.getByText('Example')).toBeDefined();
  });
});

// ---- files ----

describe('ColumnRenderer — files', () => {
  it('renders file count for a non-empty array', () => {
    const col = makeColumn({ columnType: 'files' });
    render(
      <ColumnRenderer
        column={col}
        value={[{ name: 'doc.pdf', size: 1024 }, { name: 'img.png', size: 2048 }]}
      />
    );
    expect(screen.getByText('2 files')).toBeDefined();
  });

  it('renders singular "file" for one file', () => {
    const col = makeColumn({ columnType: 'files' });
    render(<ColumnRenderer column={col} value={[{ name: 'doc.pdf', size: 512 }]} />);
    expect(screen.getByText('1 file')).toBeDefined();
  });

  it('renders "-" for empty files array', () => {
    const col = makeColumn({ columnType: 'files' });
    render(<ColumnRenderer column={col} value={[]} />);
    expect(screen.getByText('-')).toBeDefined();
  });
});

// ---- formula ----

describe('ColumnRenderer — formula', () => {
  it('renders a plain formula result value', () => {
    const col = makeColumn({ columnType: 'formula' });
    render(<ColumnRenderer column={col} value={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders formula result from object with .result field', () => {
    const col = makeColumn({ columnType: 'formula' });
    render(<ColumnRenderer column={col} value={{ result: 99 }} />);
    expect(screen.getByText('99')).toBeDefined();
  });
});

// ---- timeline ----

describe('ColumnRenderer — timeline', () => {
  it('renders start and end dates', () => {
    const col = makeColumn({ columnType: 'timeline' });
    render(
      <ColumnRenderer
        column={col}
        value={{ start: '2024-03-10T12:00:00', end: '2024-03-20T12:00:00' }}
      />
    );
    // Both dates appear within the same span separated by an em-dash
    const span = screen.getByText((_, el) =>
      el?.tagName === 'SPAN' &&
      (el.textContent?.includes('Mar 10, 2024') ?? false) &&
      (el.textContent?.includes('Mar 20, 2024') ?? false)
    );
    expect(span).toBeDefined();
  });

  it('renders "-" when start is missing', () => {
    const col = makeColumn({ columnType: 'timeline' });
    render(<ColumnRenderer column={col} value={{ end: '2024-01-31T12:00:00' }} />);
    expect(screen.getByText('-')).toBeDefined();
  });
});

// ---- rating ----

describe('ColumnRenderer — rating', () => {
  it('renders 5 star icons for a max-5 rating column', () => {
    const col = makeColumn({ columnType: 'rating', config: { max: 5 } });
    const { container } = render(<ColumnRenderer column={col} value={3} />);
    // lucide Star renders SVGs; count them
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('renders filled stars equal to the rating value', () => {
    const col = makeColumn({ columnType: 'rating', config: { max: 5 } });
    const { container } = render(<ColumnRenderer column={col} value={3} />);
    const filledStars = container.querySelectorAll('.fill-yellow-400');
    expect(filledStars.length).toBe(3);
  });
});
