// Smart Solar Microgrid Trading System - Navigation Sidebar with fold/unfold toggle
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  History,
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

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  exact?: boolean;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { role } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Backoffice", "GridOperator"],
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
      roles: ["Backoffice", "GridOperator"],
      exact: true,
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
      roles: ["Backoffice", "GridOperator"],
    },
    {
      label: "Node Management",
      path: "/stations",
      icon: Server,
      roles: ["Backoffice", "GridOperator"],
      exact: true,
    },
    {
      label: "Node Map",
      path: "/stations/map",
      icon: Map,
      roles: ["Backoffice", "GridOperator"],
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
          <div className="flex items-center gap-2 truncate pr-2">
            <img src="/logo-emblem.png" alt="SolarGridX Logo" className="size-5 object-contain shrink-0" />
            <span className="text-xs font-bold tracking-tight text-foreground truncate">
              Solar<span className="text-[#0284C7]">Grid</span><span className="text-[#10B981]">X</span>
            </span>
          </div>
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
              end={item.exact ?? (item.path === '/reservations' || item.path === '/stations')}
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
    </aside>
  );
}
