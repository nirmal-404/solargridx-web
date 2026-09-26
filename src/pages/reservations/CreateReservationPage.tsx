// Smart Solar Microgrid Trading System - Create Reservation Page
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Loader2,
  PlusCircle,
  ArrowLeft,
  AlertCircle,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { stationSlotService } from "@/services/stationSlotService";
import { reservationService } from "@/services/reservationService";
import { formatDateTime, isWithinSevenDayWindow } from "@/utils/dateUtils";
import { parseApiError } from "@/utils/errorParser";
import type { SolarStation, EnergyBookingSlot } from "@/types/station";

export function CreateReservationPage() {
  const navigate = useNavigate();

  const [stations, setStations] = useState<SolarStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");

  const [slots, setSlots] = useState<EnergyBookingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const [requestedCapacity, setRequestedCapacity] = useState<string>("");
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load active stations on mount
  useEffect(() => {
    async function loadStations() {
      setIsLoadingStations(true);
      try {
        const stationList = await stationSlotService.getStations(false);
        setStations(stationList);
        if (stationList.length > 0) {
          setSelectedStationId(stationList[0].stationId);
        }
      } catch (err: unknown) {
        setErrorMessage(
          parseApiError(err, "Failed to load microgrid solar stations."),
        );
      } finally {
        setIsLoadingStations(false);
      }
    }
    loadStations();
  }, []);

  // Load available slots when station changes
  useEffect(() => {
    if (!selectedStationId) {
      setSlots([]);
      setSelectedSlotId("");
      return;
    }

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSelectedSlotId("");
      try {
        const availableSlots = await stationSlotService.getSlots(
          selectedStationId,
          false,
        );
        // Filter to future slots within 7-day window
        const validSlots = availableSlots.filter(
          (s) =>
            isWithinSevenDayWindow(s.startTime).valid &&
            s.availableCapacity > 0,
        );
        setSlots(validSlots);
        if (validSlots.length > 0) {
          setSelectedSlotId(validSlots[0].slotId);
        }
      } catch (err: unknown) {
        setErrorMessage(
          parseApiError(err, "Failed to load energy booking slots."),
        );
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedStationId]);

  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedStationId) {
      setErrorMessage("Please select a solar microgrid station.");
      return;
    }

    if (!selectedSlotId || !selectedSlot) {
      setErrorMessage("Please select an available booking slot.");
      return;
    }

    const capacityNum = parseFloat(requestedCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setErrorMessage("Requested capacity must be a positive number.");
      return;
    }

    if (capacityNum > selectedSlot.availableCapacity) {
      setErrorMessage(
        `Requested capacity (${capacityNum} kWh) exceeds available capacity (${selectedSlot.availableCapacity} kWh).`,
      );
      return;
    }

    const windowCheck = isWithinSevenDayWindow(selectedSlot.startTime);
    if (!windowCheck.valid) {
      setErrorMessage(
        windowCheck.reason || "Slot time is outside the 7-day booking window.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await reservationService.createReservation({
        stationId: selectedStationId,
        slotId: selectedSlotId,
        requestedCapacity: capacityNum,
      });
      navigate("/reservations");
    } catch (err: unknown) {
      setErrorMessage(
        parseApiError(err, "Failed to create energy reservation."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/reservations")}
          className="gap-1.5 text-xs h-8"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Book Energy Slot
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reserve solar microgrid energy capacity within the authorized 7-day
            schedule.
          </p>
        </div>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Reservation Details</CardTitle>
              <CardDescription className="text-xs">
                Select station, available slot, and desired capacity
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 border border-amber-500/20">
              <Zap className="size-3" />
              <span>7-Day Window</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Station Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="station" className="text-xs">
                Microgrid Solar Station
              </Label>
              {isLoadingStations ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Loading stations...</span>
                </div>
              ) : (
                <Select
                  value={selectedStationId}
                  onValueChange={setSelectedStationId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="station" className="text-xs">
                    <SelectValue placeholder="Select a station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.stationId} value={s.stationId}>
                        {s.name} ({s.stationId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Slot Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="slot" className="text-xs">
                Available Energy Slot Window
              </Label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Loading bookable slots within 7 days...</span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1.5">
                  No active future slots available within the 7-day horizon for
                  this station.
                </p>
              ) : (
                <Select
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="slot" className="text-xs">
                    <SelectValue placeholder="Select an energy slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s.slotId} value={s.slotId}>
                        {formatDateTime(s.startTime)} —{" "}
                        {formatDateTime(s.endTime)} ({s.availableCapacity} kWh
                        available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Capacity Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="capacity">
                  Requested Energy Capacity (kWh)
                </Label>
                {selectedSlot && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Available: {selectedSlot.availableCapacity} kWh
                  </span>
                )}
              </div>
              <Input
                id="capacity"
                type="number"
                step="0.1"
                min="0.1"
                max={selectedSlot ? selectedSlot.availableCapacity : undefined}
                placeholder="e.g. 10.0"
                value={requestedCapacity}
                onChange={(e) => setRequestedCapacity(e.target.value)}
                disabled={isSubmitting || !selectedSlotId}
                className="text-xs font-mono"
              />
            </div>

            {/* Notice Rule Information Box */}
            <div className="rounded-lg border bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Authoritative Reservation Terms</span>
              </div>
              <p>
                1. Reservations are created in{" "}
                <span className="font-semibold text-foreground">Pending</span>{" "}
                status for operator approval.
              </p>
              <p>
                2. Changes or cancellations must be made at least{" "}
                <span className="font-semibold text-foreground">12 hours</span>{" "}
                before scheduled session start time.
              </p>
              <p>
                3. Capacity is conditionally deducted by the central microgrid
                API to prevent overbooking conflicts.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/reservations")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedSlotId || slots.length === 0}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                <PlusCircle className="size-3.5" />
                Confirm Reservation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
