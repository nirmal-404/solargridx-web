// Smart Solar Microgrid Trading System - Reservation Data Table
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatNoticeStatus, hasTwelveHourNotice } from '@/utils/dateUtils';
import {
  Loader2,
  Edit2,
  XCircle,
  CheckCircle2,
  QrCode,
  Clock,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import type { ReservationResponse } from '@/types/reservation';

interface ReservationTableProps {
  reservations: ReservationResponse[];
  isLoading: boolean;
  isStaff: boolean;
  onEdit?: (reservation: ReservationResponse) => void;
  onCancel?: (reservation: ReservationResponse) => void;
  onApprove?: (reservation: ReservationResponse) => void;
  onReject?: (reservation: ReservationResponse) => void;
  onViewQr?: (reservation: ReservationResponse) => void;
}

export function ReservationTable({
  reservations,
  isLoading,
  isStaff,
  onEdit,
  onCancel,
  onApprove,
  onReject,
  onViewQr,
}: ReservationTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card/50 p-12 text-center text-muted-foreground gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading energy slot reservations...</p>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card/50 p-12 text-center text-muted-foreground gap-2">
        <Inbox className="size-10 stroke-1 text-muted-foreground/60" />
        <h3 className="text-sm font-semibold text-foreground">No reservations found</h3>
        <p className="text-xs max-w-sm">
          No energy slot reservations match your current filter criteria or role scope.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 text-xs">
            <TableHead className="font-semibold">Reservation ID</TableHead>
            {isStaff && <TableHead className="font-semibold">Prosumer NIC</TableHead>}
            <TableHead className="font-semibold">Station ID</TableHead>
            <TableHead className="font-semibold">Scheduled Window</TableHead>
            <TableHead className="font-semibold text-right">Capacity (kWh)</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold">Notice Lock</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((r) => {
            const isPending = r.status === 'Pending';
            const isApproved = r.status === 'Approved';
            const isActive = isPending || isApproved;
            const canModify = isActive && hasTwelveHourNotice(r.scheduledStartTime);
            const notice = formatNoticeStatus(r.scheduledStartTime);

            return (
              <TableRow key={r.id} className="text-xs transition-colors hover:bg-muted/30">
                {/* Reservation ID */}
                <TableCell className="font-mono font-medium text-foreground py-3">
                  {r.reservationId}
                </TableCell>

                {/* Prosumer NIC (Staff only) */}
                {isStaff && (
                  <TableCell className="font-mono text-muted-foreground">
                    {r.prosumerNic || '—'}
                  </TableCell>
                )}

                {/* Station */}
                <TableCell className="font-medium text-foreground">
                  {r.stationId}
                </TableCell>

                {/* Scheduled Times */}
                <TableCell className="text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      {formatDateTime(r.scheduledStartTime)}
                    </span>
                    <span className="text-[11px] block text-muted-foreground">
                      to {formatDateTime(r.scheduledEndTime)}
                    </span>
                  </div>
                </TableCell>

                {/* Capacity */}
                <TableCell className="text-right font-mono font-semibold text-foreground">
                  {r.requestedCapacity.toFixed(1)}
                </TableCell>

                {/* Status Badge */}
                <TableCell className="text-center">
                  <StatusBadge status={r.status} />
                </TableCell>

                {/* Notice Status Indicator */}
                <TableCell>
                  {isActive ? (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {canModify ? (
                        <>
                          <Clock className="size-3 text-blue-500" />
                          <span className="text-muted-foreground">{notice.text}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-3 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {notice.text}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Completed</span>
                  )}
                </TableCell>

                {/* Action Buttons */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View QR Button for Prosumer */}
                    {isApproved && onViewQr && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onViewQr(r)}
                        className="gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-[11px]"
                      >
                        <QrCode className="size-3" />
                        <span>QR Token</span>
                      </Button>
                    )}

                    {/* Operational Approve for Staff */}
                    {isPending && isStaff && onApprove && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onApprove(r)}
                        className="gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-[11px]"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Approve</span>
                      </Button>
                    )}

                    {/* Operational Reject for Staff */}
                    {isPending && isStaff && onReject && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onReject(r)}
                        className="gap-1 text-rose-600 hover:bg-rose-500/10 text-[11px]"
                      >
                        <XCircle className="size-3" />
                        <span>Reject</span>
                      </Button>
                    )}

                    {/* Edit Button (requires 12h notice) */}
                    {isActive && onEdit && (
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={!canModify}
                        onClick={() => onEdit(r)}
                        title={canModify ? 'Update reservation' : 'Locked (< 12 hours notice)'}
                        className="gap-1 text-muted-foreground hover:text-foreground text-[11px]"
                      >
                        <Edit2 className="size-3" />
                        <span className="hidden md:inline">Edit</span>
                      </Button>
                    )}

                    {/* Cancel Button (requires 12h notice) */}
                    {isActive && onCancel && (
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={!canModify}
                        onClick={() => onCancel(r)}
                        title={canModify ? 'Cancel reservation' : 'Locked (< 12 hours notice)'}
                        className="gap-1 text-rose-600 hover:bg-rose-500/10 text-[11px]"
                      >
                        <XCircle className="size-3" />
                        <span className="hidden md:inline">Cancel</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
