// Smart Solar Microgrid Trading System - Reservation Filter Toolbar
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Search, Filter } from 'lucide-react';
import type { ReservationFilterParams, ReservationStatus } from '@/types/reservation';
import type { SolarStation } from '@/types/station';

interface FilterToolbarProps {
  filters: ReservationFilterParams;
  stations: SolarStation[];
  isStaff: boolean;
  onFilterChange: (filters: ReservationFilterParams) => void;
  onReset: () => void;
}

export function FilterToolbar({
  filters,
  stations,
  isStaff,
  onFilterChange,
  onReset,
}: FilterToolbarProps) {
  const handleStationChange = (val: string) => {
    onFilterChange({
      ...filters,
      stationId: val === 'ALL' ? undefined : val,
    });
  };

  const handleStatusChange = (val: string) => {
    onFilterChange({
      ...filters,
      status: val === 'ALL' ? undefined : (val as ReservationStatus),
    });
  };

  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      nic: e.target.value || undefined,
    });
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      to: e.target.value ? new Date(e.target.value).toISOString() : undefined,
    });
  };

  const hasActiveFilters =
    !!filters.stationId ||
    !!filters.status ||
    !!filters.nic ||
    !!filters.from ||
    !!filters.to;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 p-3.5 backdrop-blur-xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
        <Filter className="size-3.5" />
        <span>Filters:</span>
      </div>

      {/* Station Dropdown */}
      <div className="w-48">
        <Select
          value={filters.stationId || 'ALL'}
          onValueChange={handleStationChange}
        >
          <SelectTrigger className="w-full text-xs">
            <SelectValue placeholder="All Stations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stations</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.stationId} value={s.stationId}>
                {s.name || s.stationId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Dropdown */}
      <div className="w-36">
        <Select
          value={filters.status || 'ALL'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff NIC Search */}
      {isStaff && (
        <div className="relative w-44">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search Prosumer NIC..."
            value={filters.nic || ''}
            onChange={handleNicChange}
            className="pl-8 text-xs h-8"
          />
        </div>
      )}

      {/* Date Range: From */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">From:</span>
        <Input
          type="date"
          onChange={handleFromChange}
          className="w-36 h-8 text-xs"
        />
      </div>

      {/* Date Range: To */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">To:</span>
        <Input
          type="date"
          onChange={handleToChange}
          className="w-36 h-8 text-xs"
        />
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}
