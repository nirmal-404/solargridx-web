// Smart Solar Microgrid Trading System - Solar Station & Slot API Transport
import { apiClient } from './apiClient';
import type { EnergyBookingSlot, SolarStation } from '@/types/station';

export const stationSlotService = {
  // Returns active solar stations
  async getStations(includeInactive = false): Promise<SolarStation[]> {
    const response = await apiClient.get<SolarStation[]>('/stations', {
      params: { includeInactive },
    });
    return response.data;
  },

  // Returns slots, optionally filtered by station and bookable availability
  async getSlots(stationId?: string, availableOnly = true): Promise<EnergyBookingSlot[]> {
    const response = await apiClient.get<EnergyBookingSlot[]>('/slots', {
      params: { stationId, availableOnly },
    });
    return response.data;
  },

  // Returns slots for a specific station
  async getSlotsByStation(stationId: string): Promise<EnergyBookingSlot[]> {
    const response = await apiClient.get<EnergyBookingSlot[]>(`/stations/${stationId}/slots`);
    return response.data;
  },
};
