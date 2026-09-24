// Smart Solar Microgrid Trading System - Application Top Header
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { SunMedium, LogOut } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import type { UserRole } from '@/types/auth';

function avatarGradient(role: UserRole | null) {
  if (role === 'Backoffice')   return 'from-violet-500 to-purple-700';
  if (role === 'GridOperator') return 'from-sky-500 to-blue-700';
  return 'from-emerald-500 to-teal-700';
}

export function AppHeader() {
  const { user, role, logout } = useAuth();
  const gradient = avatarGradient(role);
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/logo-emblem.png"
            alt="SolarGridX Logo"
            className="size-8 object-contain shrink-0"
          />
          <div className="hidden md:flex items-center border-r pr-4 mr-1 h-6">
            <span className="text-base font-bold tracking-tight text-foreground">
              Solar<span className="text-[#0284C7]">Grid</span><span className="text-[#10B981]">X</span>
            </span>
          </div>
        </div>
        <Breadcrumb />
      </div>

      {/* Right: Avatar + Logout */}
      <div className="flex items-center gap-2">
        {user && (
          <Link
            to="/profile"
            id="header-profile-link"
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors group"
            title="My Profile"
          >
            {/* initials avatar */}
            <div className={`size-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ring-offset-card ring-transparent group-hover:ring-primary/40 transition-all`}>
              {initials}
            </div>
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-foreground leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-muted-foreground leading-tight">{role}</p>
            </div>
          </Link>
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

