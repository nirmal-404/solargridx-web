// Smart Solar Microgrid Trading System - Node Management Page
// Provides a full CRUD interface for solar station nodes: table view, create/edit
// slide-over form, schedule editor, deactivate/reactivate actions.
// This is a pure UI layer — all business logic lives in the C# Web API.
import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, Check, MapPin, Plus, RefreshCw,
  Zap, Server, ChevronDown, ChevronUp, X, Pencil, PowerOff, Power,
  Battery,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  stationSlotService,
  type CreateStationPayload,
  type UpdateStationPayload,
} from '@/services/stationSlotService';
import { parseApiError } from '@/utils/errorParser';
import type { SolarStation, OperationalSchedule, DailyHours, EnergyBookingSlot } from '@/types/station';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FormMode = 'create' | 'edit' | 'schedule' | null;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_SCHEDULE: OperationalSchedule = { days: [] };

function SlotStatusBadge({ status }: { status?: string | null }) {
  const s = status ?? 'Available';
  let badgeClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  let dotClass = 'bg-emerald-500';

  if (s === 'Reserved') {
    badgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    dotClass = 'bg-amber-500';
  } else if (s === 'Unavailable' || s === 'Deactivated') {
    badgeClass = 'bg-muted text-muted-foreground';
    dotClass = 'bg-muted-foreground';
  } else if (s === 'Completed') {
    badgeClass = 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    dotClass = 'bg-blue-500';
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      status === 'Active'
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-muted text-muted-foreground'
    }`}>
      <span className={`size-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScheduleEditor
// ─────────────────────────────────────────────────────────────────────────────
function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: OperationalSchedule;
  onChange: (s: OperationalSchedule) => void;
}) {
  const addDay = () => {
    const usedDays = new Set(schedule.days.map((d) => d.day));
    const next = [1, 2, 3, 4, 5, 6, 0].find((d) => !usedDays.has(d)) ?? 0;
    onChange({ ...schedule, days: [...schedule.days, { day: next, open: '08:00', close: '17:00' }] });
  };

  const removeDay = (i: number) =>
    onChange({ ...schedule, days: schedule.days.filter((_, idx) => idx !== i) });

  const updateDay = (i: number, patch: Partial<DailyHours>) =>
    onChange({
      ...schedule,
      days: schedule.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    });

  return (
    <div className="space-y-2">
      {schedule.days.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            id={`day-select-${i}`}
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            value={d.day}
            onChange={(e) => updateDay(i, { day: Number(e.target.value) })}
          >
            {DAY_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
          <input
            type="time"
            id={`open-time-${i}`}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            value={d.open}
            onChange={(e) => updateDay(i, { open: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="time"
            id={`close-time-${i}`}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            value={d.close}
            onChange={(e) => updateDay(i, { close: e.target.value })}
          />
          <button
            type="button"
            onClick={() => removeDay(i)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove day"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addDay} className="text-xs h-7 gap-1.5 mt-1">
        <Plus className="size-3" /> Add Day
      </Button>
    </div>
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

  // Form state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingStation, setEditingStation] = useState<SolarStation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create/Edit form fields
  const [fStationId, setFStationId] = useState('');
  const [fName, setFName] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fLatitude, setFLatitude] = useState('');
  const [fLongitude, setFLongitude] = useState('');
  const [fCapacity, setFCapacity] = useState('');
  const [fBatterySlots, setFBatterySlots] = useState('');
  const [fSchedule, setFSchedule] = useState<OperationalSchedule>(EMPTY_SCHEDULE);

  // Row expand for schedule view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load stations
  const loadStations = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await stationSlotService.getStations(isBackoffice && includeInactive);
      setStations(data);
    } catch (err) {
      setErrorMessage(parseApiError(err, 'Failed to load stations.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadStations(); }, [includeInactive]);

  // ── Open forms ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingStation(null);
    setFStationId(''); setFName(''); setFDescription('');
    setFLatitude(''); setFLongitude('');
    setFCapacity(''); setFBatterySlots('');
    setFSchedule(EMPTY_SCHEDULE);
    setFormError(null);
    setFormMode('create');
  };

  const openEdit = (s: SolarStation) => {
    setEditingStation(s);
    setFName(s.name); setFDescription(s.description ?? '');
    setFLatitude(String(s.latitude)); setFLongitude(String(s.longitude));
    setFCapacity(String(s.capacityKwh));
    setFBatterySlots(String(s.availableBatteryStorageSlots));
    setFormError(null);
    setFormMode('edit');
  };

  const openSchedule = (s: SolarStation) => {
    setEditingStation(s);
    setFSchedule(s.schedule ?? EMPTY_SCHEDULE);
    setFormError(null);
    setFormMode('schedule');
  };

  const closeForm = () => { setFormMode(null); setFormError(null); };

  // ── Submit create / edit ──────────────────────────────────────────────────
  const handleSubmitStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        const payload: CreateStationPayload = {
          stationId: fStationId.trim().toUpperCase(),
          name: fName.trim(),
          description: fDescription.trim() || undefined,
          latitude: parseFloat(fLatitude),
          longitude: parseFloat(fLongitude),
          capacityKwh: parseFloat(fCapacity),
          availableBatteryStorageSlots: parseInt(fBatterySlots, 10),
          schedule: fSchedule,
        };
        await stationSlotService.createStation(payload);
        setSuccessMessage('Station created successfully.');
      } else if (formMode === 'edit' && editingStation) {
        const payload: UpdateStationPayload = {
          name: fName.trim(),
          description: fDescription.trim() || undefined,
          latitude: parseFloat(fLatitude),
          longitude: parseFloat(fLongitude),
          capacityKwh: parseFloat(fCapacity),
          availableBatteryStorageSlots: parseInt(fBatterySlots, 10),
        };
        await stationSlotService.updateStation(editingStation.stationId, payload);
        setSuccessMessage('Station updated successfully.');
      }
      closeForm();
      await loadStations();
    } catch (err) {
      setFormError(parseApiError(err, 'Operation failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Submit schedule ───────────────────────────────────────────────────────
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await stationSlotService.updateSchedule(editingStation.stationId, fSchedule);
      setSuccessMessage('Schedule updated successfully.');
      closeForm();
      await loadStations();
    } catch (err) {
      setFormError(parseApiError(err, 'Schedule update failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Deactivate / reactivate ───────────────────────────────────────────────
  const handleDeactivate = async (s: SolarStation) => {
    setErrorMessage(null);
    try {
      await stationSlotService.deactivateStation(s.stationId);
      setSuccessMessage(`Station '${s.stationId}' deactivated.`);
      await loadStations();
    } catch (err) {
      // Surfaces 409 "Cannot deactivate: active reservations exist" from the API
      setErrorMessage(parseApiError(err, 'Deactivation failed.'));
    }
  };

  const handleReactivate = async (s: SolarStation) => {
    setErrorMessage(null);
    try {
      await stationSlotService.reactivateStation(s.stationId);
      setSuccessMessage(`Station '${s.stationId}' reactivated.`);
      await loadStations();
    } catch (err) {
      setErrorMessage(parseApiError(err, 'Reactivation failed.'));
    }
  };

  // ── Battery Slot Management State & Handlers ──────────────────────────────
  const [selectedStationForSlots, setSelectedStationForSlots] = useState<SolarStation | null>(null);
  const [stationSlots, setStationSlots] = useState<EnergyBookingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotSuccess, setSlotSuccess] = useState<string | null>(null);

  // Slot modal state: 'create' | 'edit' | null
  const [slotModalMode, setSlotModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSlot, setEditingSlot] = useState<EnergyBookingSlot | null>(null);
  const [slotDate, setSlotDate] = useState('2026-09-25');
  const [slotStartTime, setSlotStartTime] = useState('14:00');
  const [slotEndTime, setSlotEndTime] = useState('15:00');
  const [slotCapacity, setSlotCapacity] = useState('10');
  const [slotAvailableCapacity, setSlotAvailableCapacity] = useState('10');
  const [isSlotSaving, setIsSlotSaving] = useState(false);
  const [deactivatingSlotId, setDeactivatingSlotId] = useState<string | null>(null);

  const loadSlotsForStation = async (stationId: string) => {
    setIsLoadingSlots(true);
    setSlotError(null);
    try {
      const data = await stationSlotService.getSlots(stationId, false);
      setStationSlots(data);
    } catch (err) {
      setSlotError(parseApiError(err, 'Failed to load battery slots.'));
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

  const openCreateSlot = () => {
    setEditingSlot(null);
    setSlotDate('2026-09-25');
    setSlotStartTime('14:00');
    setSlotEndTime('15:00');
    setSlotCapacity('10');
    setSlotAvailableCapacity('10');
    setSlotModalMode('create');
  };

  const openEditSlot = (slot: EnergyBookingSlot) => {
    setEditingSlot(slot);
    setSlotCapacity(String(slot.capacity));
    setSlotAvailableCapacity(String(slot.availableCapacity));
    setSlotModalMode('edit');
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationForSlots) return;
    setIsSlotSaving(true);
    setSlotError(null);
    try {
      if (slotModalMode === 'create') {
        const startIso = new Date(`${slotDate}T${slotStartTime}:00Z`).toISOString();
        const endIso = new Date(`${slotDate}T${slotEndTime}:00Z`).toISOString();
        await stationSlotService.createSlot({
          stationId: selectedStationForSlots.stationId,
          startTime: startIso,
          endTime: endIso,
          capacity: parseFloat(slotCapacity),
        });
        setSlotSuccess('Battery slot created successfully.');
      } else if (slotModalMode === 'edit' && editingSlot) {
        await stationSlotService.updateSlot(editingSlot.slotId, {
          capacity: parseFloat(slotCapacity),
          availableCapacity: slotAvailableCapacity ? parseFloat(slotAvailableCapacity) : undefined,
        });
        setSlotSuccess('Slot capacity updated successfully.');
      }
      setSlotModalMode(null);
      await loadSlotsForStation(selectedStationForSlots.stationId);
    } catch (err) {
      setSlotError(parseApiError(err, 'Slot operation failed.'));
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
      setSlotError(parseApiError(err, 'Failed to deactivate slot.'));
    } finally {
      setDeactivatingSlotId(null);
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Node Management</h1>
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
          <Button variant="outline" size="sm" onClick={loadStations} disabled={isLoading} className="gap-1.5 text-xs h-8">
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isBackoffice && (
            <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs h-8" id="btn-create-station">
              <Plus className="size-3.5" /> Add Station
            </Button>
          )}
        </div>
      </div>

      {/* ── Toasts ── */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" /><span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto"><X className="size-3" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" /><span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto"><X className="size-3" /></button>
        </div>
      )}

      {/* ── Slide-over panel ── */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="w-full max-w-md overflow-y-auto bg-background shadow-2xl border-l border-border flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-sm font-semibold text-foreground">
                {formMode === 'create' ? 'Add New Station' : formMode === 'edit' ? `Edit — ${editingStation?.stationId}` : `Schedule — ${editingStation?.stationId}`}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {/* ── Create / Edit form ── */}
            {(formMode === 'create' || formMode === 'edit') && (
              <form onSubmit={(e) => void handleSubmitStation(e)} className="flex-1 space-y-4 p-4">
                {formMode === 'create' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="f-station-id">Station ID *</label>
                    <input id="f-station-id" required value={fStationId} onChange={(e) => setFStationId(e.target.value)}
                      placeholder="SGX-01" maxLength={50}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="f-name">Name *</label>
                  <input id="f-name" required value={fName} onChange={(e) => setFName(e.target.value)}
                    placeholder="Colombo North Hub"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="f-description">Description</label>
                  <textarea id="f-description" value={fDescription} onChange={(e) => setFDescription(e.target.value)}
                    rows={2} placeholder="Optional notes"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="f-latitude">Latitude *</label>
                    <input id="f-latitude" required type="number" step="any" min="-90" max="90"
                      value={fLatitude} onChange={(e) => setFLatitude(e.target.value)} placeholder="6.9271"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="f-longitude">Longitude *</label>
                    <input id="f-longitude" required type="number" step="any" min="-180" max="180"
                      value={fLongitude} onChange={(e) => setFLongitude(e.target.value)} placeholder="79.8612"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="f-capacity">Capacity (kWh) *</label>
                    <input id="f-capacity" required type="number" step="0.01" min="0.01"
                      value={fCapacity} onChange={(e) => setFCapacity(e.target.value)} placeholder="150"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="f-battery-slots">Battery Slots *</label>
                    <input id="f-battery-slots" required type="number" min="0" step="1"
                      value={fBatterySlots} onChange={(e) => setFBatterySlots(e.target.value)} placeholder="4"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {formMode === 'create' && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Operating Schedule</p>
                    <ScheduleEditor schedule={fSchedule} onChange={setFSchedule} />
                  </div>
                )}

                {formError && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5" />{formError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSaving} className="flex-1 text-xs h-9" id="btn-submit-station">
                    {isSaving ? 'Saving…' : formMode === 'create' ? 'Create Station' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm} className="text-xs h-9">Cancel</Button>
                </div>
              </form>
            )}

            {/* ── Schedule form ── */}
            {formMode === 'schedule' && (
              <form onSubmit={(e) => void handleSubmitSchedule(e)} className="flex-1 space-y-4 p-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="tz-input">Time Zone (IANA, optional)</label>
                  <input id="tz-input" value={fSchedule.timeZoneId ?? ''} placeholder="Asia/Colombo"
                    onChange={(e) => setFSchedule({ ...fSchedule, timeZoneId: e.target.value || undefined })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Operating Windows</p>
                  <ScheduleEditor schedule={fSchedule} onChange={setFSchedule} />
                </div>
                {formError && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5" />{formError}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSaving} className="flex-1 text-xs h-9" id="btn-submit-schedule">
                    {isSaving ? 'Saving…' : 'Update Schedule'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm} className="text-xs h-9">Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Battery Slot Management Slide-over Drawer ── */}
      {selectedStationForSlots && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closeSlotManagement} />
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
                  Station Node ID: <span className="font-mono font-medium text-foreground">{selectedStationForSlots.stationId}</span> · Total Node Storage: {selectedStationForSlots.capacityKwh} kWh
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
                <button onClick={closeSlotManagement} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Toasts inside slot drawer */}
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              {slotSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <Check className="size-4 shrink-0" /><span>{slotSuccess}</span>
                  <button onClick={() => setSlotSuccess(null)} className="ml-auto"><X className="size-3" /></button>
                </div>
              )}
              {slotError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" /><span>{slotError}</span>
                  <button onClick={() => setSlotError(null)} className="ml-auto"><X className="size-3" /></button>
                </div>
              )}

              {/* Slot Table */}
              <div className="rounded-lg border bg-card overflow-hidden flex-1">
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center p-12 text-xs text-muted-foreground gap-2">
                    <RefreshCw className="size-4 animate-spin" /> Loading battery slots…
                  </div>
                ) : stationSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Battery className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No battery booking slots created for this microgrid station yet.</p>
                    <Button size="sm" onClick={openCreateSlot} className="mt-3 text-xs gap-1 h-7">
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
                          <th className="py-2.5 px-3 text-right">Available (kWh)</th>
                          <th className="py-2.5 px-3 text-right">Max (kWh)</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stationSlots.map((slot) => {
                          const dateStr = slot.startTime ? new Date(slot.startTime).toISOString().slice(0, 10) : '—';
                          const startTimeStr = slot.startTime ? new Date(slot.startTime).toISOString().slice(11, 16) : '—';
                          const endTimeStr = slot.endTime ? new Date(slot.endTime).toISOString().slice(11, 16) : '—';
                          const isDeactivating = deactivatingSlotId === slot.slotId;

                          return (
                            <tr key={slot.slotId} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-foreground">{slot.slotId}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{dateStr}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{startTimeStr}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{endTimeStr}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {slot.availableCapacity.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {slot.capacity.toFixed(1)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <SlotStatusBadge status={slot.computedStatus ?? (slot.status === 'Active' ? (slot.availableCapacity > 0 ? 'Available' : 'Reserved') : 'Unavailable')} />
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
                                  {slot.status === 'Active' && (
                                    <button
                                      id={`btn-deactivate-slot-${slot.slotId}`}
                                      title="Deactivate slot"
                                      disabled={isDeactivating}
                                      onClick={() => void handleDeactivateSlot(slot)}
                                      className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                      {isDeactivating ? <RefreshCw className="size-3 animate-spin" /> : <PowerOff className="size-3" />}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSlotModalMode(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {slotModalMode === 'create' ? '+ Create Battery Slot' : `Edit Capacity — ${editingSlot?.slotId}`}
              </h3>
              <button onClick={() => setSlotModalMode(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveSlot(e)} className="space-y-3 text-xs">
              {slotModalMode === 'create' ? (
                <>
                  <div>
                    <label className="font-medium text-muted-foreground block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Start Time *</label>
                      <input
                        type="time"
                        required
                        value={slotStartTime}
                        onChange={(e) => setSlotStartTime(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">End Time *</label>
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
                    <label className="font-medium text-muted-foreground block mb-1">Capacity (kWh) *</label>
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
                    <label className="font-medium text-muted-foreground block mb-1">Total Capacity (kWh) *</label>
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
                    <label className="font-medium text-muted-foreground block mb-1">Available Capacity (kWh) *</label>
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
                  <AlertCircle className="size-3.5" />{slotError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSlotSaving} className="flex-1 text-xs h-8" id="btn-submit-slot">
                  {isSlotSaving ? 'Saving…' : slotModalMode === 'create' ? 'Create Slot' : 'Update Capacity'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSlotModalMode(null)} className="text-xs h-8">
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
                {stations.length} station{stations.length !== 1 ? 's' : ''} loaded
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
              <p className="text-sm text-muted-foreground">No station nodes found.</p>
              {isBackoffice && (
                <Button size="sm" onClick={openCreate} className="mt-4 text-xs gap-1.5">
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
                        <span className="font-mono text-xs font-semibold text-foreground">{s.stationId}</span>
                        <span className="text-sm text-foreground font-medium truncate">{s.name}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="size-2.5" />{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Zap className="size-2.5" />{s.capacityKwh} kWh
                        </span>
                        <span>{s.availableBatteryStorageSlots} battery slots</span>
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
                      <button
                        title="Toggle schedule"
                        onClick={() => setExpandedId(expandedId === s.stationId ? null : s.stationId)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {expandedId === s.stationId ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        Schedule
                      </button>
                      {isBackoffice && (
                        <>
                          <button
                            id={`btn-edit-${s.stationId}`}
                            title="Edit station"
                            onClick={() => openEdit(s)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            id={`btn-schedule-${s.stationId}`}
                            title="Edit schedule"
                            onClick={() => openSchedule(s)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <MapPin className="size-3.5" />
                          </button>
                          {s.status === 'Active' ? (
                            <button
                              id={`btn-deactivate-${s.stationId}`}
                              title="Deactivate station"
                              onClick={() => void handleDeactivate(s)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <PowerOff className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              id={`btn-reactivate-${s.stationId}`}
                              title="Reactivate station"
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

                  {/* ── Expanded schedule ── */}
                  {expandedId === s.stationId && (
                    <div className="bg-muted/20 px-6 pb-3 pt-2 text-xs">
                      {!s.schedule?.days?.length ? (
                        <span className="text-muted-foreground italic">No schedule configured.</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {s.schedule.days.map((d, i) => (
                            <span key={i} className="rounded-md border border-border bg-background px-2 py-1 font-medium">
                              {DAY_NAMES[d.day]}: {d.open} – {d.close}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
