// Smart Solar Microgrid Trading System - Enterprise Application Layout
import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/common/AppHeader';
import { Sidebar } from '@/components/common/Sidebar';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('solargridx_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('solargridx_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Validating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
