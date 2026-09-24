// Smart Solar Microgrid Trading System - Authentication Service
import { apiClient } from './apiClient';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/auth';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', request);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async register(request: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', request);
    return response.data;
  },

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.patch<User>('/auth/me', request);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/me/change-password', { currentPassword, newPassword });
  },
};
