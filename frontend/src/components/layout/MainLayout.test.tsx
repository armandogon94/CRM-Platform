import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock('@/components/common/NotificationBell', () => ({
  NotificationBell: () => <button data-testid="notification-bell">Bell</button>,
}));

describe('MainLayout', () => {
  it('renders children in the main area', () => {
    render(
      <MainLayout>
        <div data-testid="page-content">Page Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('page-content')).toBeDefined();
  });

  it('renders the Sidebar', () => {
    render(<MainLayout><span /></MainLayout>);
    expect(screen.getByTestId('sidebar')).toBeDefined();
  });

  it('renders the NotificationBell in the header', () => {
    render(<MainLayout><span /></MainLayout>);
    expect(screen.getByTestId('notification-bell')).toBeDefined();
  });
});
