// Smart Solar Microgrid Trading System - Authentication and User Type Definitions

export type UserRole = 'Prosumer' | 'Backoffice' | 'GridOperator';

export type AccountStatus = 'Pending' | 'Active' | 'DeactivationRequested' | 'Deactivated';

export interface User {
  id: string;
  nic?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  token?: string;
  expiresAt?: string;
  user: User;
}

export interface RegisterRequest {
  nic: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export interface CreateUserRequest {
  role: 'Backoffice' | 'GridOperator';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

