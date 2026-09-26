// Smart Solar Microgrid Trading System - Solar Station and Slot Type Definitions

export type StationStatus = "Active" | "Deactivated";
export type SlotStatus = "Active" | "Deactivated";

export interface DailyHours {
  day: string; // DayOfWeek name serialized by System.Text.Json
  open: string; // 'HH:mm' local time
  close: string;
}

export interface OperationalSchedule {
  timeZoneId?: string;
  days: DailyHours[];
}

export interface SolarStation {
  id: string;
  stationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  capacityKwh: number;
  availableBatteryStorageSlots: number;
  schedule: OperationalSchedule;
  status: StationStatus;
}

export interface EnergyBookingSlot {
  id: string;
  slotId: string;
  stationId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableCapacity: number;
  status: SlotStatus;
  stationName?: string | null;
  computedStatus?: string | null;
}
