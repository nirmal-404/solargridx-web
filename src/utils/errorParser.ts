// Smart Solar Microgrid Trading System - API Error Parser Utility
import axios from 'axios';

export interface ApiErrorPayload {
  status?: number;
  message?: string;
  errors?: Record<string, string[]> | null;
  timestamp?: string;
}

export function parseApiError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    if (data?.message) {
      // If validation error dictionary exists, append first error
      if (data.errors && typeof data.errors === 'object') {
        const firstField = Object.keys(data.errors)[0];
        if (firstField && data.errors[firstField]?.length) {
          return `${data.message} (${data.errors[firstField][0]})`;
        }
      }
      return data.message;
    }
    if (error.response?.status === 401) {
      return 'Session expired or unauthorized. Please log in again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 409) {
      return 'Conflict: The reservation state or slot capacity has changed. Please refresh.';
    }
    if (error.response?.status === 422) {
      return 'Validation failed: Please verify the slot timing (must be within 7 days).';
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
