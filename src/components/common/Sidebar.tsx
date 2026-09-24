// Smart Solar Microgrid Trading System - Navigation Sidebar with fold/unfold toggle
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Clock,
  History,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Server,
  Map,
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { role } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Prosumer", "Backoffice", "GridOperator"],
    },
    {
      label: "User Management",
      path: "/users",
      icon: Users,
      roles: ["Backoffice"],
    },
    {
      label: "Prosumer Management",
      path: "/prosumers",
      icon: Users,
      roles: ["Backoffice"],
    },
    {
      label: "All Reservations",
      path: "/reservations",
      icon: CalendarDays,
      roles: ["Prosumer", "Backoffice", "GridOperator"],
    },
    {
      label: "Book Energy Slot",
      path: "/reservations/create",
      icon: PlusCircle,
      roles: ["Prosumer"],
    },
    {
      label: "Pending Queue",
      path: "/reservations/pending",
      icon: Clock,
      roles: ["Backoffice", "GridOperator"],
    },
    {
      label: "Booking History",
      path: "/reservations/history",
      icon: History,
      roles: ["Prosumer", "Backoffice", "GridOperator"],
    },
    {
      label: "Node Management",
      path: "/stations",
      icon: Server,
      roles: ["Backoffice", "GridOperator"],
    },
    {
      label: "Node Map",
      path: "/stations/map",
      icon: Map,
      roles: ["Prosumer", "Backoffice", "GridOperator"],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !role || item.roles.includes(role),
  );

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-card/50 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Header: label + fold/unfold button ── */}
      <div
        className={cn(
          'flex h-14 items-center border-b px-3',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate pr-2">
            Microgrid Portal
          </p>
        )}

        {/* Fold / Unfold button lives inside the sidebar */}
        <button
          onClick={onToggle}
          title={isCollapsed ? 'Unfold navigation bar' : 'Fold navigation bar'}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md border border-muted-foreground/25 bg-background',
            'size-7 text-muted-foreground transition-all duration-200',
            'hover:border-primary/50 hover:bg-primary/10 hover:text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* ── Nav Items ── */}
      <nav className={cn('flex-1 space-y-1 p-3', isCollapsed && 'flex flex-col items-center')}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              end={item.path === '/reservations'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors w-full',
                  isCollapsed ? 'justify-center px-2' : 'px-3',
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer Info Card ── */}
      <div className="p-3">
        <div
          className={cn(
            'rounded-xl border bg-muted/30 text-xs text-muted-foreground',
            isCollapsed ? 'p-2 text-center' : 'p-3.5'
          )}
        >
          <div
            className={cn(
              'flex items-center font-medium text-foreground',
              isCollapsed ? 'justify-center' : 'gap-1.5'
            )}
          >
            <Zap className="size-3.5 text-amber-500 shrink-0" />
            {!isCollapsed && <span>7-Day Horizon</span>}
          </div>
          {!isCollapsed && (
            <p className="mt-1 leading-relaxed">
              Slots are within 7 days. 12h cancellation notice required.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
