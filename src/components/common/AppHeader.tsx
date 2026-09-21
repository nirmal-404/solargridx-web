// Smart Solar Microgrid Trading System - Application Top Header
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SunMedium, LogOut } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export function AppHeader() {
  const { user, role, logout } = useAuth();

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'Backoffice':
        return 'destructive';
      case 'GridOperator':
        return 'default';
      case 'Prosumer':
      default:
        return 'secondary';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0">
          <SunMedium className="size-5" />
        </div>
        <div className="hidden md:flex items-center border-r pr-4 mr-1 h-6">
          <span className="text-base font-semibold tracking-tight text-foreground">SolarGridX</span>
        </div>
        <Breadcrumb />
      </div>

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={getRoleBadgeVariant()} className="capitalize">
              {role}
            </Badge>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
