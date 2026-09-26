// Smart Solar Microgrid Trading System - Edit Reservation Dialog
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { stationSlotService } from "@/services/stationSlotService";
import {
  formatDateTime,
  hasTwelveHourNotice,
  formatNoticeStatus,
} from "@/utils/dateUtils";
import type { ReservationResponse } from "@/types/reservation";
import type { EnergyBookingSlot } from "@/types/station";

interface EditReservationDialogProps {
  reservation: ReservationResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onUpdate: (
    reservationId: string,
    stationId: string,
    slotId: string,
    capacity: number,
  ) => Promise<void>;
}

export function EditReservationDialog({
  reservation,
  open,
  onOpenChange,
  onSuccess,
  onUpdate,
}: EditReservationDialogProps) {
  const [slots, setSlots] = useState<EnergyBookingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [requestedCapacity, setRequestedCapacity] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reservation || !open) return;

    setSelectedSlotId(reservation.slotId);
    setRequestedCapacity(reservation.requestedCapacity.toString());
    setErrorMessage(null);

    async function loadSlots() {
      if (!reservation) return;
      setIsLoadingSlots(true);
      try {
        const availableSlots = await stationSlotService.getSlots(
          reservation.stationId,
          false,
        );
        setSlots(availableSlots);
      } catch {
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    loadSlots();
  }, [reservation, open]);

  if (!reservation) return null;

  const notice = formatNoticeStatus(reservation.scheduledStartTime);
  const canModify = hasTwelveHourNotice(reservation.scheduledStartTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;

    const capacityNum = parseFloat(requestedCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setErrorMessage("Requested capacity must be a positive number.");
      return;
    }

    if (!selectedSlotId) {
      setErrorMessage("Please select a booking slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onUpdate(
        reservation.reservationId,
        reservation.stationId,
        selectedSlotId,
        capacityNum,
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          "Failed to update reservation. Ensure 12 hours notice and available capacity.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Reservation</DialogTitle>
          <DialogDescription>
            Booking ID:{" "}
            <span className="font-mono font-medium text-foreground">
              {reservation.reservationId}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* 12-Hour Notice Status Banner */}
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
            canModify
              ? "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
          }`}
        >
          <Clock className="size-4 shrink-0" />
          <span>
            {canModify
              ? `Notice window satisfied: ${notice.text}.`
              : "Updates locked: Requires at least 12 hours notice prior to slot start time."}
          </span>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Current Scheduled Start</Label>
            <p className="text-sm font-medium text-foreground">
              {formatDateTime(reservation.scheduledStartTime)}
            </p>
          </div>

          {/* Slot Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="slot" className="text-xs">
              Change Slot Window
            </Label>
            {isLoadingSlots ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Loading available slots...</span>
              </div>
            ) : (
              <Select
                value={selectedSlotId}
                onValueChange={setSelectedSlotId}
                disabled={!canModify || isSubmitting}
              >
                <SelectTrigger id="slot" className="text-xs">
                  <SelectValue placeholder="Select an energy slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={reservation.slotId}>
                    Keep Current Slot (
                    {formatDateTime(reservation.scheduledStartTime)})
                  </SelectItem>
                  {slots
                    .filter((s) => s.slotId !== reservation.slotId)
                    .map((s) => (
                      <SelectItem key={s.slotId} value={s.slotId}>
                        {formatDateTime(s.startTime)} — Avail:{" "}
                        {s.availableCapacity} kWh
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Capacity Input */}
          <div className="space-y-1.5">
            <Label htmlFor="capacity" className="text-xs">
              Requested Energy Capacity (kWh)
            </Label>
            <Input
              id="capacity"
              type="number"
              step="0.1"
              min="0.1"
              value={requestedCapacity}
              onChange={(e) => setRequestedCapacity(e.target.value)}
              disabled={!canModify || isSubmitting}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canModify || isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
