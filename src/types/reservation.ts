// Smart Solar Microgrid Trading System - Reservation Type Definitions

export type ReservationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'
  | 'Expired';

export interface ReservationResponse {
  id: string;
  reservationId: string;
  stationId: string;
  slotId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  requestedCapacity: number;
  status: ReservationStatus;
  transactionId?: string | null;
  transactionExpiresAt?: string | null;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  prosumerNic?: string | null;
  transferType?: string | null;
  notes?: string | null;
  approvedByUserId?: string | null;
  completedByUserId?: string | null;
}

export interface CreateReservationRequest {
  stationId: string;
  slotId: string;
  requestedCapacity: number;
}

export interface UpdateReservationRequest {
  stationId: string;
  slotId: string;
  requestedCapacity: number;
}

export interface DashboardSummaryResponse {
  pendingReservations: number;
  approvedFutureReservations: number;
  currentReservations?: number;
  currentActiveReservations?: number;
  completedReservations: number;
}

export interface QrTokenResponse {
  transactionId: string;
  token: string;
  expiresAt: string;
}

export interface ReservationFilterParams {
  group?: 'pending' | 'current' | 'history';
  status?: ReservationStatus;
  stationId?: string;
  nic?: string;
  from?: string;
  to?: string;
}
