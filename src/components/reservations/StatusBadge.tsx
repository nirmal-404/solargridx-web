// Smart Solar Microgrid Trading System - Reservation Status Badge
import { Badge } from '@/components/ui/badge';
import type { ReservationStatus } from '@/types/reservation';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'Approved':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40';
      case 'Expired':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize text-xs tracking-wide px-2 py-0.5', getBadgeStyle(), className)}
    >
      {status}
    </Badge>
  );
}
