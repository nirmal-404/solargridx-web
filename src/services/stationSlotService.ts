// Smart Solar Microgrid Trading System - Solar Station & Slot API Transport
// Handles all station CRUD operations and slot queries for the node management domain.
import { apiClient } from "./apiClient";
import type {
  OperationalSchedule,
  SolarStation,
  EnergyBookingSlot,
} from "@/types/station";

export interface CreateStationPayload {
  stationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  capacityKwh: number;
  availableBatteryStorageSlots: number;
  schedule?: OperationalSchedule;
}

export interface UpdateStationPayload {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  capacityKwh?: number;
  availableBatteryStorageSlots?: number;
}

export interface CreateSlotPayload {
  stationId: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface UpdateSlotPayload {
  startTime?: string;
  endTime?: string;
  capacity?: number;
  availableCapacity?: number;
}

export const stationSlotService = {
  // Returns all stations; includeInactive=true is Backoffice-only on the API side.
  async getStations(includeInactive = false): Promise<SolarStation[]> {
    const response = await apiClient.get<SolarStation[]>("/stations", {
      params: { includeInactive },
    });
    return response.data;
  },

  // Retrieves a single station by its business identifier.
  async getStation(stationId: string): Promise<SolarStation> {
    const response = await apiClient.get<SolarStation>(
      `/stations/${stationId}`,
    );
    return response.data;
  },

  // Creates a new station node; requires Backoffice role.
  async createStation(payload: CreateStationPayload): Promise<SolarStation> {
    const response = await apiClient.post<SolarStation>("/stations", payload);
    return response.data;
  },

  // Updates mutable station fields; null fields are preserved by the API.
  async updateStation(
    stationId: string,
    payload: UpdateStationPayload,
  ): Promise<SolarStation> {
    const response = await apiClient.put<SolarStation>(
      `/stations/${stationId}`,
      payload,
    );
    return response.data;
  },

  // Replaces the full operational schedule for a station.
  async updateSchedule(
    stationId: string,
    schedule: OperationalSchedule,
  ): Promise<SolarStation> {
    const response = await apiClient.patch<SolarStation>(
      `/stations/${stationId}/schedule`,
      { schedule },
    );
    return response.data;
  },

  // Deactivates a station; API returns 409 if active reservations block this.
  async deactivateStation(stationId: string): Promise<void> {
    await apiClient.post(`/stations/${stationId}/deactivate`);
  },

  // Restores a deactivated station to Active status.
  async reactivateStation(stationId: string): Promise<void> {
    await apiClient.post(`/stations/${stationId}/reactivate`);
  },

  // Returns slots, optionally including inactive entries for staff management.
  async getSlots(
    stationId?: string,
    includeInactive = false,
  ): Promise<EnergyBookingSlot[]> {
    const response = await apiClient.get<EnergyBookingSlot[]>("/slots", {
      params: { stationId, includeInactive },
    });
    return response.data;
  },

  // Returns slots for a specific station.
  async getSlotsByStation(stationId: string): Promise<EnergyBookingSlot[]> {
    const response = await apiClient.get<EnergyBookingSlot[]>(
      `/stations/${stationId}/slots`,
    );
    return response.data;
  },

  // Creates a new battery booking slot for a station node.
  async createSlot(payload: CreateSlotPayload): Promise<EnergyBookingSlot> {
    const response = await apiClient.post<EnergyBookingSlot>("/slots", payload);
    return response.data;
  },

  // Updates mutable slot attributes such as capacity and times.
  async updateSlot(
    slotId: string,
    payload: UpdateSlotPayload,
  ): Promise<EnergyBookingSlot> {
    const response = await apiClient.put<EnergyBookingSlot>(
      `/slots/${slotId}`,
      payload,
    );
    return response.data;
  },

  // Deactivates a slot; API returns 409 if active reservations block this.
  async deactivateSlot(slotId: string): Promise<void> {
    await apiClient.post(`/slots/${slotId}/deactivate`);
  },
};
