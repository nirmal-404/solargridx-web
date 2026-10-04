// Smart Solar Microgrid Trading System - All Reservations Management Page
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FilterToolbar } from '@/components/reservations/FilterToolbar';
import { ReservationTable } from '@/components/reservations/ReservationTable';
import { EditReservationDialog } from '@/components/reservations/EditReservationDialog';
import { QrTokenModal } from '@/components/reservations/QrTokenModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { stationSlotService } from '@/services/stationSlotService';
import { parseApiError } from '@/utils/errorParser';
import type { ReservationFilterParams, ReservationResponse } from '@/types/reservation';
import type { SolarStation } from '@/types/station';

export function ReservationsPage() {
  const { isProsumer, isStaff } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [stations, setStations] = useState<SolarStation[]>([]);
  const [filters, setFilters] = useState<ReservationFilterParams>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal dialog states
  const [selectedForEdit, setSelectedForEdit] = useState<ReservationResponse | null>(null);
  const [selectedForQr, setSelectedForQr] = useState<ReservationResponse | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<ReservationResponse | null>(null);
  const [selectedForApprove, setSelectedForApprove] = useState<ReservationResponse | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<ReservationResponse | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await reservationService.getReservations(filters);
      setReservations(data);
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Failed to retrieve reservation listings.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    async function loadStations() {
      try {
        const stationList = await stationSlotService.getStations(false);
        setStations(stationList);
      } catch {
        setStations([]);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Handle Cancel action
  const handleConfirmCancel = async () => {
    if (!selectedForCancel) return;
    setIsProcessingAction(true);
    try {
      await reservationService.cancelReservation(selectedForCancel.reservationId);
      setSelectedForCancel(null);
      showToast(`Reservation ${selectedForCancel.reservationId} was cancelled successfully.`);
      loadReservations();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Could not cancel reservation. Ensure 12 hours notice.'));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Approve action (Staff)
  const handleConfirmApprove = async () => {
    if (!selectedForApprove) return;
    setIsProcessingAction(true);
    try {
      await reservationService.approveReservation(selectedForApprove.reservationId);
      setSelectedForApprove(null);
      showToast(`Reservation ${selectedForApprove.reservationId} approved successfully.`);
      loadReservations();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Approval failed.'));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject action (Staff)
  const handleConfirmReject = async () => {
    if (!selectedForReject) return;
    setIsProcessingAction(true);
    try {
      await reservationService.rejectReservation(selectedForReject.reservationId);
      setSelectedForReject(null);
      showToast(`Reservation ${selectedForReject.reservationId} rejected and capacity released.`);
      loadReservations();
    } catch (err: unknown) {
      setErrorMessage(parseApiError(err, 'Rejection failed.'));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Update mutation
  const handleUpdate = async (
    reservationId: string,
    stationId: string,
    slotId: string,
    capacity: number
  ) => {
    await reservationService.updateReservation(reservationId, {
      stationId,
      slotId,
      requestedCapacity: capacity,
    });
    showToast(`Reservation ${reservationId} updated successfully.`);
    loadReservations();
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reservation Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse, filter, and manage scheduled solar energy trading sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReservations}
            disabled={isLoading}
            className="gap-1.5 text-xs h-8"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {isProsumer && (
            <Button
              size="sm"
              onClick={() => navigate('/reservations/create')}
              className="gap-1.5 text-xs h-8"
            >
              <PlusCircle className="size-3.5" />
              <span>Book Slot</span>
            </Button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <FilterToolbar
        filters={filters}
        stations={stations}
        isStaff={isStaff}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {/* Main Reservation Data Table */}
      <ReservationTable
        reservations={reservations}
        isLoading={isLoading}
        isStaff={isStaff}
        onEdit={(r) => setSelectedForEdit(r)}
        onCancel={(r) => setSelectedForCancel(r)}
        onApprove={(r) => setSelectedForApprove(r)}
        onReject={(r) => setSelectedForReject(r)}
        onViewQr={(r) => setSelectedForQr(r)}
      />

      {/* Edit Dialog */}
      <EditReservationDialog
        reservation={selectedForEdit}
        open={!!selectedForEdit}
        onOpenChange={(open) => !open && setSelectedForEdit(null)}
        onSuccess={loadReservations}
        onUpdate={handleUpdate}
      />

      {/* QR Token Modal */}
      <QrTokenModal
        reservation={selectedForQr}
        open={!!selectedForQr}
        onOpenChange={(open) => !open && setSelectedForQr(null)}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={!!selectedForCancel}
        onOpenChange={(open) => !open && setSelectedForCancel(null)}
        title="Cancel Reservation"
        description={`Are you sure you want to cancel booking ${selectedForCancel?.reservationId}? This action requires at least 12 hours notice and will release reserved capacity back to the microgrid slot.`}
        confirmText="Confirm Cancellation"
        variant="destructive"
        isLoading={isProcessingAction}
        onConfirm={handleConfirmCancel}
      />

      {/* Approve Confirmation Dialog (Staff) */}
      <ConfirmDialog
        open={!!selectedForApprove}
        onOpenChange={(open) => !open && setSelectedForApprove(null)}
        title="Approve Energy Reservation"
        description={`Confirm approval for booking ${selectedForApprove?.reservationId} (${selectedForApprove?.requestedCapacity} kWh). This will initialize the transaction and generate the QR verification hash.`}
        confirmText="Approve Booking"
        variant="default"
        isLoading={isProcessingAction}
        onConfirm={handleConfirmApprove}
      />

      {/* Reject Confirmation Dialog (Staff) */}
      <ConfirmDialog
        open={!!selectedForReject}
        onOpenChange={(open) => !open && setSelectedForReject(null)}
        title="Reject Energy Reservation"
        description={`Are you sure you want to reject booking ${selectedForReject?.reservationId}? Held capacity (${selectedForReject?.requestedCapacity} kWh) will be restored to the slot immediately.`}
        confirmText="Reject Booking"
        variant="destructive"
        isLoading={isProcessingAction}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
