import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../common/NotificationBell';
import type { ThemeConfig } from '../../theme';

interface MainLayoutProps {
  children: ReactNode;
  theme?: ThemeConfig;
}

export function MainLayout({ children, theme }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar theme={theme} />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <header className="h-12 border-b border-gray-200 bg-white flex items-center justify-end px-4 shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
