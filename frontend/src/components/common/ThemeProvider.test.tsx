import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <span data-testid="child">Hello</span>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('applies default brand CSS custom properties', () => {
    const { container } = render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    const div = container.querySelector('.theme-provider') as HTMLElement;
    expect(div).toBeDefined();
    expect(div.style.getPropertyValue('--brand-primary')).toBe('#6366F1');
    expect(div.style.getPropertyValue('--brand-secondary')).toBe('#4F46E5');
    expect(div.style.getPropertyValue('--brand-accent')).toBe('#818CF8');
  });

  it('applies custom brand colors from props', () => {
    const { container } = render(
      <ThemeProvider primaryColor="#ff0000" secondaryColor="#00ff00" accentColor="#0000ff">
        <span />
      </ThemeProvider>
    );
    const div = container.querySelector('.theme-provider') as HTMLElement;
    expect(div.style.getPropertyValue('--brand-primary')).toBe('#ff0000');
    expect(div.style.getPropertyValue('--brand-secondary')).toBe('#00ff00');
    expect(div.style.getPropertyValue('--brand-accent')).toBe('#0000ff');
  });
});
