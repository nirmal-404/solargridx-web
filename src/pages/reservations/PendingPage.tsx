// Smart Solar Microgrid Trading System - Pending Reservations Operational Queue
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ReservationTable } from '@/components/reservations/ReservationTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Clock, AlertCircle, Check } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { parseApiError } from '@/utils/errorParser';
import type { ReservationResponse } from '@/types/reservation';

export function PendingPage() {
  const { isStaff } = useAuth();

  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [selectedForApprove, setSelectedForApprove] = useState<ReservationResponse | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<ReservationResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const loadPending = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await reservationService.getPendingReservations();
      setPendingReservations(data);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to retrieve pending reservations.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async () => {
    if (!selectedForApprove) return;
    setIsProcessing(true);
    try {
      await reservationService.approveReservation(selectedForApprove.reservationId);
      setSelectedForApprove(null);
      showToast(`Reservation ${selectedForApprove.reservationId} approved successfully.`);
      loadPending();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Approval failed.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedForReject) return;
    setIsProcessing(true);
    try {
      await reservationService.rejectReservation(selectedForReject.reservationId);
      setSelectedForReject(null);
      showToast(`Reservation ${selectedForReject.reservationId} rejected and capacity restored.`);
      loadPending();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Rejection failed.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Pending Queue
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational review queue: Approve bookings to generate QR verification tokens or reject to release held slot capacity.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPending}
          disabled={isLoading}
          className="gap-1.5 text-xs h-8"
        >
          <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <ReservationTable
        reservations={pendingReservations}
        isLoading={isLoading}
        isStaff={isStaff}
        onApprove={(r) => setSelectedForApprove(r)}
        onReject={(r) => setSelectedForReject(r)}
      />

      <ConfirmDialog
        open={!!selectedForApprove}
        onOpenChange={(open) => !open && setSelectedForApprove(null)}
        title="Approve Energy Reservation"
        description={`Confirm approval for ${selectedForApprove?.reservationId} (${selectedForApprove?.requestedCapacity} kWh, Type: ${selectedForApprove?.transferType ?? 'Drop-Off'}${selectedForApprove?.notes ? `, Notes: "${selectedForApprove.notes}"` : ''})? A QR verification hash will be created.`}
        confirmText="Approve"
        variant="default"
        isLoading={isProcessing}
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={!!selectedForReject}
        onOpenChange={(open) => !open && setSelectedForReject(null)}
        title="Reject Energy Reservation"
        description={`Are you sure you want to reject ${selectedForReject?.reservationId}? The held capacity (${selectedForReject?.requestedCapacity} kWh) will be restored back to the microgrid slot.`}
        confirmText="Reject"
        variant="destructive"
        isLoading={isProcessing}
        onConfirm={handleReject}
      />
    </div>
  );
}
