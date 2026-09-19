// Smart Solar Microgrid Trading System - Reservation API Transport Service
import { apiClient } from './apiClient';
import type {
  CreateReservationRequest,
  DashboardSummaryResponse,
  QrTokenResponse,
  ReservationFilterParams,
  ReservationResponse,
  UpdateReservationRequest,
} from '@/types/reservation';

export const reservationService = {
  // Creates a new energy slot reservation
  async createReservation(request: CreateReservationRequest): Promise<ReservationResponse> {
    const response = await apiClient.post<ReservationResponse>('/reservations', request);
    return response.data;
  },

  // Lists reservations with optional filters (group, status, stationId, nic, from, to)
  async getReservations(params?: ReservationFilterParams): Promise<ReservationResponse[]> {
    const response = await apiClient.get<ReservationResponse[]>('/reservations', { params });
    return response.data;
  },

  // Retrieves a single reservation by business identifier
  async getReservationById(reservationId: string): Promise<ReservationResponse> {
    const response = await apiClient.get<ReservationResponse>(`/reservations/${reservationId}`);
    return response.data;
  },

  // Retrieves pending reservations queue directly
  async getPendingReservations(): Promise<ReservationResponse[]> {
    const response = await apiClient.get<ReservationResponse[]>('/reservations/pending');
    return response.data;
  },

  // Retrieves booking history directly
  async getBookingHistory(): Promise<ReservationResponse[]> {
    const response = await apiClient.get<ReservationResponse[]>('/reservations/history');
    return response.data;
  },

  // Retrieves reservations for a specific Prosumer NIC (Staff role)
  async getReservationsByNic(nic: string): Promise<ReservationResponse[]> {
    const response = await apiClient.get<ReservationResponse[]>(`/reservations/prosumer/${nic}`);
    return response.data;
  },

  // Updates an active reservation's slot or capacity
  async updateReservation(
    reservationId: string,
    request: UpdateReservationRequest
  ): Promise<ReservationResponse> {
    const response = await apiClient.put<ReservationResponse>(`/reservations/${reservationId}`, request);
    return response.data;
  },

  // Cancels an active reservation (returns 204 NoContent)
  async cancelReservation(reservationId: string): Promise<void> {
    await apiClient.post(`/reservations/${reservationId}/cancel`);
  },

  // Approves a pending reservation and creates transaction info (Staff role)
  async approveReservation(reservationId: string): Promise<ReservationResponse> {
    const response = await apiClient.post<ReservationResponse>(`/reservations/${reservationId}/approve`);
    return response.data;
  },

  // Rejects a pending reservation and restores slot capacity (Staff role, returns 204)
  async rejectReservation(reservationId: string): Promise<void> {
    await apiClient.post(`/reservations/${reservationId}/reject`);
  },

  // Issues / rotates opaque QR transaction token for approved reservation (Prosumer role)
  async getTransactionToken(reservationId: string): Promise<QrTokenResponse> {
    const response = await apiClient.post<QrTokenResponse>(
      `/reservations/${reservationId}/transaction-token`
    );
    return response.data;
  },

  // Retrieves live dashboard KPI aggregate counts
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
    return response.data;
  },
};
