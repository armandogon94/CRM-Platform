import { type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content area - offset for sidebar.
          Uses ml-16 when sidebar is collapsed, ml-64 when expanded.
          We default to ml-64 since the sidebar starts expanded.
          The sidebar handles its own width transitions. */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
