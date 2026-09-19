// Smart Solar Microgrid Trading System - Solar Station and Slot Type Definitions

export type StationStatus = 'Active' | 'Deactivated';
export type SlotStatus = 'Active' | 'Deactivated';

export interface SolarStation {
  id: string;
  stationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  capacityKwh: number;
  availableBatteryStorageSlots: number;
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
}
