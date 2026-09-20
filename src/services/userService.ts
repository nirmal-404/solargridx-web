// Smart Solar Microgrid Trading System - Staff User Management Service
import { apiClient } from './apiClient';
import type { CreateUserRequest, User } from '@/types/auth';

export const userService = {
  // Retrieves all staff accounts (Backoffice and GridOperator)
  async getStaffUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/staff');
    return response.data;
  },

  // Creates a new staff account with GridOperator or Backoffice role
  async createStaffUser(request: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/staff', request);
    return response.data;
  },
};
