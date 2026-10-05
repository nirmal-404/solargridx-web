// Smart Solar Microgrid Trading System - Node Management Page
// Provides a full CRUD interface for solar station nodes: table view, create/edit
// slide-over form, schedule editor, deactivate/reactivate actions.
// This is a pure UI layer — all business logic lives in the C# Web API.
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Check,
  MapPin,
  Plus,
  RefreshCw,
  Zap,
  Server,
  X,
  Pencil,
  PowerOff,
  Power,
  Battery,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  stationSlotService,
  type CreateStationPayload,
  type UpdateStationPayload,
} from "@/services/stationSlotService";
import { parseApiError } from "@/utils/errorParser";
import type { SolarStation, EnergyBookingSlot } from "@/types/station";
import { LocationPickerModal } from "@/components/stations/LocationPickerModal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FormMode = "create" | "edit" | null;

function SlotStatusBadge({ status }: { status?: string | null }) {
  const s = status ?? "Available";
  let badgeClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  let dotClass = "bg-emerald-500";

  if (s === "Reserved") {
    badgeClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    dotClass = "bg-amber-500";
  } else if (s === "Unavailable" || s === "Deactivated") {
    badgeClass = "bg-muted text-muted-foreground";
    dotClass = "bg-muted-foreground";
  } else if (s === "Completed") {
    badgeClass = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
    dotClass = "bg-blue-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
    >
      <span className={`size-1.5 rounded-full ${dotClass}`} />
      {s}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        status === "Active"
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${status === "Active" ? "bg-emerald-500" : "bg-muted-foreground"}`}
      />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function NodeManagementPage() {
  const { isBackoffice } = useAuth();

  const [stations, setStations] = useState<SolarStation[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deactivatingStationId, setDeactivatingStationId] = useState<
    string | null
  >(null);

  // Form state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingStation, setEditingStation] = useState<SolarStation | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create/Edit form fields
  const [fStationId, setFStationId] = useState("");
  const [fName, setFName] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fLatitude, setFLatitude] = useState("");
  const [fLongitude, setFLongitude] = useState("");
  const [fCapacity, setFCapacity] = useState("");
  const [fBatterySlots, setFBatterySlots] = useState("");

  // Map location picker state
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const handleLocationSelected = (lat: number, lng: number) => {
    setFLatitude(lat.toFixed(6));
    setFLongitude(lng.toFixed(6));
  };

  // Load stations
  const loadStations = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await stationSlotService.getStations(
        isBackoffice && includeInactive,
      );
      setStations(data);
    } catch (err) {
      setErrorMessage(parseApiError(err, "Failed to load stations."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStations();
  }, [includeInactive]);

  // ── Station ID generator ──────────────────────────────────────────────────
  // Loops until it produces an ID not already present in the loaded list.
  // This prevents frontend-side duplicates. The backend is the final authority
  // and will reject with 409 if a race condition still occurs.
  const generateUniqueStationId = (
    existingStations: typeof stations,
  ): string => {
    const taken = new Set(
      existingStations.map((s) => s.stationId.toUpperCase()),
    );
    let candidate: string;
    do {
      candidate = `SGX-${String(Math.floor(1000 + Math.random() * 9000))}`;
    } while (taken.has(candidate));
    return candidate;
  };

  // ── Open forms ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingStation(null);
    setFStationId(generateUniqueStationId(stations));
    setFName("");
    setFDescription("");
    setFLatitude("");
    setFLongitude("");
    setFCapacity("");
    setFBatterySlots("");
    setFormError(null);
    setFormMode("create");
  };

  const openEdit = (s: SolarStation) => {
    setEditingStation(s);
    setFName(s.name);
    setFDescription(s.description ?? "");
    setFLatitude(String(s.latitude));
    setFLongitude(String(s.longitude));
    setFCapacity(String(s.capacityKwh));
    setFBatterySlots(String(s.availableBatteryStorageSlots));
    setFormError(null);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError(null);
  };

  // ── Submit create / edit ──────────────────────────────────────────────────
  const handleSubmitStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        const payload: CreateStationPayload = {
          stationId: fStationId.trim().toUpperCase(),
          name: fName.trim(),
          description: fDescription.trim(),
          latitude: parseFloat(fLatitude),
          longitude: parseFloat(fLongitude),
          capacityKwh: parseFloat(fCapacity),
          availableBatteryStorageSlots: parseInt(fBatterySlots, 10),
        };
        await stationSlotService.createStation(payload);
        setSuccessMessage("Station created successfully.");
      } else if (formMode === "edit" && editingStation) {
        const payload: UpdateStationPayload = {
          name: fName.trim(),
          description: fDescription.trim(),
          latitude: parseFloat(fLatitude),
          longitude: parseFloat(fLongitude),
          capacityKwh: parseFloat(fCapacity),
          availableBatteryStorageSlots: parseInt(fBatterySlots, 10),
        };
        await stationSlotService.updateStation(
          editingStation.stationId,
          payload,
        );
        setSuccessMessage("Station updated successfully.");
      }
      closeForm();
      await loadStations();
    } catch (err: unknown) {
      // If the backend returns 409 it means another user registered the same
      // Station ID between when this form was opened and when it was submitted.
      // Auto-regenerate a fresh unique ID and prompt the user to retry.
      const isConflict =
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        (err as { status: number }).status === 409;
      if (isConflict && formMode === "create") {
        await loadStations(); // refresh list so next generation avoids it
        setFStationId(generateUniqueStationId(stations));
        setFormError(
          "That Station ID was just taken by another user. A new unique ID has been generated — please submit again.",
        );
      } else {
        setFormError(parseApiError(err, "Operation failed."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Deactivate / reactivate ───────────────────────────────────────────────
  const handleDeactivate = async (s: SolarStation) => {
    if (
      !window.confirm(
        `Deactivate ${s.name}? Active reservations will block this action.`,
      )
    )
      return;

    setDeactivatingStationId(s.stationId);
    setErrorMessage(null);
    try {
      await stationSlotService.deactivateStation(s.stationId);
      setSuccessMessage(`Station '${s.stationId}' deactivated.`);
      await loadStations();
    } catch (err) {
      // Surfaces 409 "Cannot deactivate: active reservations exist" from the API
      setErrorMessage(parseApiError(err, "Deactivation failed."));
    } finally {
      setDeactivatingStationId(null);
    }
  };

  const handleReactivate = async (s: SolarStation) => {
    setErrorMessage(null);
    try {
      await stationSlotService.reactivateStation(s.stationId);
      setSuccessMessage(`Station '${s.stationId}' reactivated.`);
      await loadStations();
    } catch (err) {
      setErrorMessage(parseApiError(err, "Reactivation failed."));
    }
  };

  // ── Battery Slot Management State & Handlers ──────────────────────────────
  const [selectedStationForSlots, setSelectedStationForSlots] =
    useState<SolarStation | null>(null);
  const [stationSlots, setStationSlots] = useState<EnergyBookingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotSuccess, setSlotSuccess] = useState<string | null>(null);

  // Slot modal state: 'create' | 'edit' | null
  const [slotModalMode, setSlotModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSlot, setEditingSlot] = useState<EnergyBookingSlot | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [slotDate, setSlotDate] = useState(todayStr);
  const [slotStartTime, setSlotStartTime] = useState('14:00');
  const [slotEndTime, setSlotEndTime] = useState('15:00');
  const [slotCapacity, setSlotCapacity] = useState('10');
  const [slotAvailableCapacity, setSlotAvailableCapacity] = useState('10');
  const [isSlotSaving, setIsSlotSaving] = useState(false);
  const [deactivatingSlotId, setDeactivatingSlotId] = useState<string | null>(
    null,
  );

  // Recurring Slot Generator state
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recStartDate, setRecStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [recEndDate, setRecEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [recSelectedDays, setRecSelectedDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]); // Mon-Fri default
  const [recTimeSlots, setRecTimeSlots] = useState<
    { startTime: string; endTime: string }[]
  >([{ startTime: "08:00", endTime: "10:00" }]);
  const [recCapacity, setRecCapacity] = useState("10");
  const [recSkipConflicts, setRecSkipConflicts] = useState(true);
  const [isRecSaving, setIsRecSaving] = useState(false);

  const loadSlotsForStation = async (stationId: string) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    try {
      const data = await stationSlotService.getSlots(stationId, true);
      setStationSlots(data);
    } catch (err) {
      setSlotError(parseApiError(err, "Failed to load battery slots."));
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const openSlotManagement = (s: SolarStation) => {
    setSelectedStationForSlots(s);
    setSlotError(null);
    setSlotSuccess(null);
    void loadSlotsForStation(s.stationId);
  };

  const closeSlotManagement = () => {
    setSelectedStationForSlots(null);
    setStationSlots([]);
    setSlotError(null);
    setSlotSuccess(null);
    setSlotModalMode(null);
  };

  const openRecurringSlotModal = () => {
    setIsRecurringModalOpen(true);
    setSlotError(null);
  };

  const closeRecurringSlotModal = () => {
    setIsRecurringModalOpen(false);
  };

  const openCreateSlot = () => {
    setEditingSlot(null);
    const today = new Date().toISOString().slice(0, 10);
    setSlotDate(today);
    setSlotStartTime('14:00');
    setSlotEndTime('15:00');
    setSlotCapacity('10');
    setSlotAvailableCapacity('10');
    setSlotError(null);
    setSlotModalMode('create');
  };

  const openEditSlot = (slot: EnergyBookingSlot) => {
    setEditingSlot(slot);
    setSlotCapacity(String(slot.capacity));
    setSlotAvailableCapacity(String(slot.availableCapacity));
    setSlotError(null);
    setSlotModalMode('edit');
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationForSlots) return;

    setSlotError(null);

    // Form Validations
    if (slotModalMode === 'create') {
      if (!slotDate) {
        setSlotError('Please select a date.');
        return;
      }

      // Restrict to current date and forward date only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(`${slotDate}T00:00:00`);
      if (selectedDate < today) {
        setSlotError('Date cannot be in the past. Only today or future dates can be selected.');
        return;
      }

      if (!slotStartTime || !slotEndTime) {
        setSlotError('Please enter both start time and end time.');
        return;
      }

      if (slotEndTime <= slotStartTime) {
        setSlotError('End time must be after start time.');
        return;
      }

      const cap = parseFloat(slotCapacity);
      if (isNaN(cap) || cap <= 0) {
        setSlotError('Slot capacity must be a positive number greater than 0.');
        return;
      }

      if (cap > selectedStationForSlots.capacityKwh) {
        setSlotError(
          `Slot capacity (${cap} kWh) cannot exceed station total capacity (${selectedStationForSlots.capacityKwh} kWh).`
        );
        return;
      }
    } else if (slotModalMode === 'edit') {
      const cap = parseFloat(slotCapacity);
      const availCap = parseFloat(slotAvailableCapacity);
      if (isNaN(cap) || cap <= 0) {
        setSlotError('Total capacity must be a positive number.');
        return;
      }
      if (isNaN(availCap) || availCap < 0) {
        setSlotError('Available capacity cannot be negative.');
        return;
      }
      if (availCap > cap) {
        setSlotError(`Available capacity (${availCap} kWh) cannot exceed total capacity (${cap} kWh).`);
        return;
      }
    }

    setIsSlotSaving(true);
    try {
      if (slotModalMode === "create") {
        const startIso = new Date(
          `${slotDate}T${slotStartTime}:00Z`,
        ).toISOString();
        const endIso = new Date(`${slotDate}T${slotEndTime}:00Z`).toISOString();
        await stationSlotService.createSlot({
          stationId: selectedStationForSlots.stationId,
          startTime: startIso,
          endTime: endIso,
          capacity: parseFloat(slotCapacity),
        });
        setSlotSuccess("Battery slot created successfully.");
      } else if (slotModalMode === "edit" && editingSlot) {
        await stationSlotService.updateSlot(editingSlot.slotId, {
          capacity: parseFloat(slotCapacity),
          availableCapacity: slotAvailableCapacity
            ? parseFloat(slotAvailableCapacity)
            : undefined,
        });
        setSlotSuccess("Slot capacity updated successfully.");
      }
      setSlotModalMode(null);
      await loadSlotsForStation(selectedStationForSlots.stationId);
    } catch (err) {
      setSlotError(parseApiError(err, "Slot operation failed."));
    } finally {
      setIsSlotSaving(false);
    }
  };

  const handleDeactivateSlot = async (slot: EnergyBookingSlot) => {
    if (!selectedStationForSlots) return;
    setDeactivatingSlotId(slot.slotId);
    setSlotError(null);
    setSlotSuccess(null);
    try {
      await stationSlotService.deactivateSlot(slot.slotId);
      setSlotSuccess(`Slot ${slot.slotId} deactivated successfully.`);
      await loadSlotsForStation(selectedStationForSlots.stationId);
    } catch (err) {
      setSlotError(parseApiError(err, "Failed to deactivate slot."));
    } finally {
      setDeactivatingSlotId(null);
    }
  };

  // ── Recurring Slot Generator Handlers ─────────────────────────────────────
  const toggleDaySelection = (day: number) => {
    setRecSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const addTimeSlotWindow = () => {
    setRecTimeSlots((prev) => [
      ...prev,
      { startTime: "12:00", endTime: "14:00" },
    ]);
  };

  const removeTimeSlotWindow = (index: number) => {
    if (recTimeSlots.length <= 1) return;
    setRecTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTimeSlotWindow = (
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setRecTimeSlots((prev) =>
      prev.map((ts, i) => (i === index ? { ...ts, [field]: value } : ts)),
    );
  };

  const handleCreateRecurringSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationForSlots) return;
    setIsRecSaving(true);
    setSlotError(null);
    setSlotSuccess(null);
    try {
      const payload = {
        stationId: selectedStationForSlots.stationId,
        startDate: recStartDate,
        endDate: recEndDate,
        daysOfWeek: recSelectedDays,
        timeSlots: recTimeSlots,
        capacity: parseFloat(recCapacity),
        skipExistingConflicts: recSkipConflicts,
      };
      const res = await stationSlotService.createRecurringSlots(payload);
      setSlotSuccess(
        `Recurring creation complete! Created ${res.totalCreated} slot(s)${
          res.totalSkipped > 0
            ? `, skipped ${res.totalSkipped} conflicting slot(s)`
            : ""
        }.`,
      );
      setIsRecurringModalOpen(false);
      await loadSlotsForStation(selectedStationForSlots.stationId);
    } catch (err) {
      setSlotError(parseApiError(err, "Recurring slot generation failed."));
    } finally {
      setIsRecSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Node Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, configure, and manage solar microgrid station nodes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isBackoffice && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                id="include-inactive-toggle"
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadStations}
            disabled={isLoading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {isBackoffice && (
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-1.5 text-xs h-8"
              id="btn-create-station"
            >
              <Plus className="size-3.5" /> Add Station
            </Button>
          )}
        </div>
      </div>

      {/* ── Toasts ── */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto">
            <X className="size-3" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto">
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* ── Slide-over panel ── */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={closeForm}
          />
          <div className="w-full max-w-md overflow-y-auto bg-background shadow-2xl border-l border-border flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                {formMode === "create"
                  ? "Add New Station"
                  : `Edit — ${editingStation?.stationId}`}
              </h2>
              <button
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ── Create / Edit form ── */}
            {(formMode === "create" || formMode === "edit") &&
              (() => {
                // ── Inline validation ─────────────────────────────────────────
                const nameErr =
                  fName.trim().length === 0
                    ? "Name is required."
                    : fName.length > 30
                      ? "Name must be 30 characters or fewer."
                      : null;
                const descErr =
                  fDescription.length > 50
                    ? "Description must be 50 characters or fewer."
                    : null;
                const capErr =
                  fCapacity === ""
                    ? "Capacity is required."
                    : isNaN(Number(fCapacity)) || Number(fCapacity) <= 0
                      ? "Capacity must be a positive number."
                      : null;
                const slotsErr =
                  fBatterySlots === ""
                    ? "Battery slots is required."
                    : !/^\d+$/.test(fBatterySlots)
                      ? "Battery slots must be a whole number."
                      : Number(fBatterySlots) < 0
                        ? "Battery slots cannot be negative."
                        : null;
                const formIsValid =
                  !nameErr && !descErr && !capErr && !slotsErr;

                const inputBase =
                  "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors";
                const inputOk = "border-border focus:ring-primary";
                const inputError =
                  "border-destructive/60 focus:ring-destructive/40";

                return (
                  <form
                    onSubmit={(e) => void handleSubmitStation(e)}
                    className="flex-1 space-y-4 p-4"
                  >
                    {/* Station ID (auto-generated display) */}
                    {formMode === "create" && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Station ID
                        </p>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                          <span className="flex-1 font-mono text-sm font-semibold text-foreground tracking-wide">
                            {fStationId}
                          </span>
                          <span className="text-[10px] text-muted-foreground select-none">
                            Auto-generated
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor="f-name"
                        >
                          Name *
                        </label>
                        <span
                          className={`text-[10px] tabular-nums ${fName.length > 30 ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                        >
                          {fName.length}/30
                        </span>
                      </div>
                      <input
                        id="f-name"
                        required
                        maxLength={31}
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        placeholder="Colombo North Hub"
                        className={`${inputBase} ${nameErr && fName.length > 0 ? inputError : inputOk}`}
                      />
                      {nameErr && fName.length > 0 && (
                        <p className="mt-1 text-[10px] text-destructive">
                          {nameErr}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor="f-description"
                        >
                          Description
                        </label>
                        <span
                          className={`text-[10px] tabular-nums ${fDescription.length > 50 ? "text-destructive font-semibold" : "text-muted-foreground"}`}
                        >
                          {fDescription.length}/50
                        </span>
                      </div>
                      <textarea
                        id="f-description"
                        rows={2}
                        maxLength={51}
                        value={fDescription}
                        onChange={(e) => setFDescription(e.target.value)}
                        placeholder="Optional notes"
                        className={`${inputBase} resize-none ${descErr ? inputError : inputOk}`}
                      />
                      {descErr && (
                        <p className="mt-1 text-[10px] text-destructive">
                          {descErr}
                        </p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary" />
                          Location Coordinates *
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMapPickerOpen(true)}
                          className="h-7 px-2.5 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                          id="btn-open-map-picker"
                        >
                          <MapPin className="size-3" />
                          {fLatitude && fLongitude
                            ? "Select on Map"
                            : "Pick from Map"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label
                            className="text-[11px] font-medium text-muted-foreground"
                            htmlFor="f-latitude"
                          >
                            Latitude *
                          </label>
                          <input
                            id="f-latitude"
                            required
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            value={fLatitude}
                            onChange={(e) => setFLatitude(e.target.value)}
                            placeholder="6.9271"
                            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label
                            className="text-[11px] font-medium text-muted-foreground"
                            htmlFor="f-longitude"
                          >
                            Longitude *
                          </label>
                          <input
                            id="f-longitude"
                            required
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            value={fLongitude}
                            onChange={(e) => setFLongitude(e.target.value)}
                            placeholder="79.8612"
                            className="mt-0.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {fLatitude &&
                      fLongitude &&
                      !isNaN(parseFloat(fLatitude)) &&
                      !isNaN(parseFloat(fLongitude)) ? (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span className="truncate">
                            📍 Selected:{" "}
                            <span className="font-mono text-foreground font-medium">
                              {parseFloat(fLatitude).toFixed(5)},{" "}
                              {parseFloat(fLongitude).toFixed(5)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsMapPickerOpen(true)}
                            className="text-primary hover:underline font-medium text-[11px] shrink-0 ml-2"
                          >
                            Adjust on Map
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground pt-0.5">
                          Click{" "}
                          <span className="text-foreground font-medium">
                            Pick from Map
                          </span>{" "}
                          to click or drag on the interactive map.
                        </p>
                      )}
                    </div>

                    {/* Capacity & Battery Slots */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor="f-capacity"
                        >
                          Capacity (kWh) *
                        </label>
                        <input
                          id="f-capacity"
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={fCapacity}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d*\.?\d*$/.test(v))
                              setFCapacity(v);
                          }}
                          placeholder="150"
                          className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-colors ${capErr && fCapacity !== "" ? inputError : inputOk}`}
                        />
                        {capErr && fCapacity !== "" && (
                          <p className="mt-1 text-[10px] text-destructive">
                            {capErr}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor="f-battery-slots"
                        >
                          Battery Slots *
                        </label>
                        <input
                          id="f-battery-slots"
                          required
                          type="number"
                          min="0"
                          step="1"
                          value={fBatterySlots}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d+$/.test(v))
                              setFBatterySlots(v);
                          }}
                          placeholder="4"
                          className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-colors ${slotsErr && fBatterySlots !== "" ? inputError : inputOk}`}
                        />
                        {slotsErr && fBatterySlots !== "" && (
                          <p className="mt-1 text-[10px] text-destructive">
                            {slotsErr}
                          </p>
                        )}
                      </div>
                    </div>

                    {formError && (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="size-3.5" />
                        {formError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isSaving || !formIsValid}
                        className="flex-1 text-xs h-9"
                        id="btn-submit-station"
                      >
                        {isSaving
                          ? "Saving…"
                          : formMode === "create"
                            ? "Create Station"
                            : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeForm}
                        className="text-xs h-9"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                );
              })()}
          </div>
        </div>
      )}

      {/* ── Interactive Location Picker Map Modal ── */}
      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLatitude={fLatitude ? parseFloat(fLatitude) : undefined}
        initialLongitude={fLongitude ? parseFloat(fLongitude) : undefined}
        onSelectLocation={handleLocationSelected}
        existingStations={stations}
        stationName={
          fName ||
          fStationId ||
          (formMode === "create" ? "New Station" : editingStation?.name)
        }
      />

      {/* ── Battery Slot Management Slide-over Drawer ── */}
      {selectedStationForSlots && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={closeSlotManagement}
          />
          <div className="w-full max-w-3xl overflow-y-auto bg-background shadow-2xl border-l border-border flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Battery className="size-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Battery Slots — {selectedStationForSlots.name}
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Station Node ID:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {selectedStationForSlots.stationId}
                  </span>{" "}
                  · Total Node Storage: {selectedStationForSlots.capacityKwh}{" "}
                  kWh
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={openCreateSlot}
                  className="gap-1 text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
                  id="btn-create-slot"
                >
                  <Plus className="size-3" /> Add Slot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openRecurringSlotModal}
                  className="gap-1 text-xs h-7 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  id="btn-recurring-slots"
                >
                  <RefreshCw className="size-3" /> Recurring Slots
                </Button>
                <button
                  onClick={closeSlotManagement}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Toasts inside slot drawer */}
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              {slotSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <Check className="size-4 shrink-0" />
                  <span>{slotSuccess}</span>
                  <button
                    onClick={() => setSlotSuccess(null)}
                    className="ml-auto"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
              {slotError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{slotError}</span>
                  <button
                    onClick={() => setSlotError(null)}
                    className="ml-auto"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}

              {/* Slot Table */}
              <div className="rounded-lg border bg-card overflow-hidden flex-1">
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
                    <RefreshCw className="size-4 animate-spin" /> Loading
                    battery slots…
                  </div>
                ) : stationSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Battery className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No battery booking slots created for this microgrid
                      station yet.
                    </p>
                    <Button
                      size="sm"
                      onClick={openCreateSlot}
                      className="mt-3 text-xs gap-1 h-7"
                    >
                      <Plus className="size-3" /> Create First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-b border-border text-[11px] text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Slot ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Start Time</th>
                          <th className="py-2.5 px-3">End Time</th>
                          <th className="py-2.5 px-3 text-right">
                            Available (kWh)
                          </th>
                          <th className="py-2.5 px-3 text-right">Max (kWh)</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stationSlots.map((slot) => {
                          const dateStr = slot.startTime
                            ? new Date(slot.startTime)
                                .toISOString()
                                .slice(0, 10)
                            : "—";
                          const startTimeStr = slot.startTime
                            ? new Date(slot.startTime)
                                .toISOString()
                                .slice(11, 16)
                            : "—";
                          const endTimeStr = slot.endTime
                            ? new Date(slot.endTime).toISOString().slice(11, 16)
                            : "—";
                          const isDeactivating =
                            deactivatingSlotId === slot.slotId;

                          return (
                            <tr
                              key={slot.slotId}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                                {slot.slotId}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {dateStr}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {startTimeStr}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {endTimeStr}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {slot.availableCapacity.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {slot.capacity.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <SlotStatusBadge
                                  status={
                                    slot.computedStatus ??
                                    (slot.status === "Active"
                                      ? slot.availableCapacity > 0
                                        ? "Available"
                                        : "Reserved"
                                      : "Unavailable")
                                  }
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    id={`btn-edit-slot-${slot.slotId}`}
                                    title="Edit capacity"
                                    onClick={() => openEditSlot(slot)}
                                    className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                  {slot.status === "Active" && (
                                    <button
                                      id={`btn-deactivate-slot-${slot.slotId}`}
                                      title="Deactivate slot"
                                      disabled={isDeactivating}
                                      onClick={() =>
                                        void handleDeactivateSlot(slot)
                                      }
                                      className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                      {isDeactivating ? (
                                        <RefreshCw className="size-3 animate-spin" />
                                      ) : (
                                        <PowerOff className="size-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Battery Slot Modal ── */}
      {slotModalMode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSlotModalMode(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {slotModalMode === "create"
                  ? "+ Create Battery Slot"
                  : `Edit Capacity — ${editingSlot?.slotId}`}
              </h3>
              <button
                onClick={() => setSlotModalMode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleSaveSlot(e)}
              className="space-y-3 text-xs"
            >
              {slotModalMode === "create" ? (
                <>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().slice(0, 10)}
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Only today or future dates can be selected.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={slotStartTime}
                        onChange={(e) => setSlotStartTime(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={slotEndTime}
                        onChange={(e) => setSlotEndTime(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Capacity (kWh) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={slotCapacity}
                      onChange={(e) => setSlotCapacity(e.target.value)}
                      placeholder="10"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Total Capacity (kWh) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={slotCapacity}
                      onChange={(e) => setSlotCapacity(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">
                      Available Capacity (kWh) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={slotAvailableCapacity}
                      onChange={(e) => setSlotAvailableCapacity(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {slotError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5" />
                  {slotError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSlotSaving}
                  className="flex-1 text-xs h-8"
                  id="btn-submit-slot"
                >
                  {isSlotSaving
                    ? "Saving…"
                    : slotModalMode === "create"
                      ? "Create Slot"
                      : "Update Capacity"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlotModalMode(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Recurring Battery Slot Generator Modal ── */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={closeRecurringSlotModal}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Generate Recurring Battery Slots
                </h3>
              </div>
              <button
                onClick={closeRecurringSlotModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleCreateRecurringSlots(e)}
              className="space-y-4 text-xs"
            >
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recStartDate}
                    onChange={(e) => setRecStartDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recEndDate}
                    onChange={(e) => setRecEndDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Days of week selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-muted-foreground">
                    Days of the Week *
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRecSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                      className="text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => setRecSelectedDays([1, 2, 3, 4, 5])}
                      className="text-primary hover:underline"
                    >
                      Weekdays
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => setRecSelectedDays([])}
                      className="text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { day: 1, label: "Mon" },
                    { day: 2, label: "Tue" },
                    { day: 3, label: "Wed" },
                    { day: 4, label: "Thu" },
                    { day: 5, label: "Fri" },
                    { day: 6, label: "Sat" },
                    { day: 0, label: "Sun" },
                  ].map(({ day, label }) => {
                    const selected = recSelectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`px-3 py-1.5 rounded-md font-medium text-xs border transition-colors ${
                          selected
                            ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400"
                            : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily time slot builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-muted-foreground">
                    Daily Time Slot Windows *
                  </label>
                  <button
                    type="button"
                    onClick={addTimeSlotWindow}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="size-3" /> Add Window
                  </button>
                </div>
                {recTimeSlots.map((ts, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        required
                        value={ts.startTime}
                        onChange={(e) =>
                          updateTimeSlotWindow(idx, "startTime", e.target.value)
                        }
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="time"
                        required
                        value={ts.endTime}
                        onChange={(e) =>
                          updateTimeSlotWindow(idx, "endTime", e.target.value)
                        }
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {recTimeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlotWindow(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        title="Remove time window"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Slot Capacity & Conflict behavior */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    Slot Capacity (kWh) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={recCapacity}
                    onChange={(e) => setRecCapacity(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recSkipConflicts}
                      onChange={(e) => setRecSkipConflicts(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Skip conflicting existing slots</span>
                  </label>
                </div>
              </div>

              {slotError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3.5" />
                  {slotError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isRecSaving || recSelectedDays.length === 0}
                  className="flex-1 text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white"
                  id="btn-submit-recurring-slots"
                >
                  {isRecSaving
                    ? "Generating Slots…"
                    : "Generate Recurring Slots"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeRecurringSlotModal}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Station table ── */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Solar Station Nodes</CardTitle>
              <CardDescription className="text-xs">
                {stations.length} station{stations.length !== 1 ? "s" : ""}{" "}
                loaded
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
              <RefreshCw className="size-4 animate-spin" /> Loading stations…
            </div>
          ) : stations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Server className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No station nodes found.
              </p>
              {isBackoffice && (
                <Button
                  size="sm"
                  onClick={openCreate}
                  className="mt-4 text-xs gap-1.5"
                >
                  <Plus className="size-3.5" /> Add First Station
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stations.map((s) => (
                <div key={s.stationId}>
                  {/* ── Row ── */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {s.stationId}
                        </span>
                        <span className="text-sm text-foreground font-medium truncate">
                          {s.name}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="size-2.5" />
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Zap className="size-2.5" />
                          {s.capacityKwh} kWh
                        </span>
                        <span>
                          {s.availableBatteryStorageSlots} battery slots
                        </span>
                      </div>
                    </div>

                    {/* ── Row actions ── */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`btn-slots-${s.stationId}`}
                        title="Manage battery slots"
                        onClick={() => openSlotManagement(s)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
                      >
                        <Battery className="size-3" />
                        Battery Slots
                      </button>
                      {isBackoffice && (
                        <>
                          <button
                            id={`btn-edit-${s.stationId}`}
                            title="Edit station"
                            aria-label={`Edit ${s.name}`}
                            onClick={() => openEdit(s)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          {s.status === "Active" ? (
                            <button
                              id={`btn-deactivate-${s.stationId}`}
                              title="Deactivate station"
                              aria-label={`Deactivate ${s.name}`}
                              disabled={deactivatingStationId === s.stationId}
                              onClick={() => void handleDeactivate(s)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <PowerOff className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              id={`btn-reactivate-${s.stationId}`}
                              title="Reactivate station"
                              aria-label={`Reactivate ${s.name}`}
                              onClick={() => void handleReactivate(s)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                            >
                              <Power className="size-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NodeManagementPage;
