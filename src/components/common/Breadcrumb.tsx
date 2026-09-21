// Smart Solar Microgrid Trading System - Dynamic Breadcrumb Navigation
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface RouteMap {
  [key: string]: string;
}

const routeNameMap: RouteMap = {
  dashboard: 'Dashboard',
  reservations: 'All Reservations',
  create: 'Book Energy Slot',
  pending: 'Pending Queue',
  history: 'Booking History',
};

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
      >
        <Home className="size-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[value.toLowerCase()] || decodeURIComponent(value);

        return (
          <div key={to} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-semibold text-foreground tracking-tight bg-muted/60 px-2 py-0.5 rounded-md">
                {displayName}
              </span>
            ) : (
              <Link to={to} className="hover:text-foreground transition-colors font-medium">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
