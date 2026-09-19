// Smart Solar Microgrid Trading System - Metric Stat Card
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value?: number | null;
  description?: string;
  icon: LucideIcon;
  variant?: 'amber' | 'blue' | 'emerald' | 'slate';
  onClick?: () => void;
}

export function StatCard({
  title,
  value = 0,
  description,
  icon: Icon,
  variant = 'emerald',
  onClick,
}: StatCardProps) {
  const variantStyles = {
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    slate: 'text-muted-foreground bg-muted/50 border-border',
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-xs'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className={cn('flex size-9 items-center justify-center rounded-lg border', variantStyles[variant])}>
            <Icon className="size-4.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {(value ?? 0).toLocaleString()}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
