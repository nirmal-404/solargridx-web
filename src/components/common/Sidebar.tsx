// Smart Solar Microgrid Trading System - Navigation Sidebar
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Clock,
  History,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { role } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Prosumer', 'Backoffice', 'GridOperator'],
    },
    {
      label: 'All Reservations',
      path: '/reservations',
      icon: CalendarDays,
      roles: ['Prosumer', 'Backoffice', 'GridOperator'],
    },
    {
      label: 'Book Energy Slot',
      path: '/reservations/create',
      icon: PlusCircle,
      roles: ['Prosumer'],
    },
    {
      label: 'Pending Queue',
      path: '/reservations/pending',
      icon: Clock,
      roles: ['Backoffice', 'GridOperator'],
    },
    {
      label: 'Booking History',
      path: '/reservations/history',
      icon: History,
      roles: ['Prosumer', 'Backoffice', 'GridOperator'],
    },
  ];

  const visibleItems = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <aside className="flex w-64 flex-col border-r bg-card/50 p-4">
      <div className="mb-6 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Microgrid Portal
        </p>
      </div>

      <nav className="space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border bg-muted/30 p-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Zap className="size-3.5 text-amber-500" />
          <span>7-Day Booking Horizon</span>
        </div>
        <p className="mt-1 leading-relaxed">
          Slots are scheduled within 7 days. Changes or cancellations require 12 hours notice.
        </p>
      </div>
    </aside>
  );
}
