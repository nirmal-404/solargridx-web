// Smart Solar Microgrid Trading System - Staff User Management Service
import { apiClient } from "./apiClient";
import type {
  CreateProsumerRequest,
  CreateUserRequest,
  PaginatedProsumerResponse,
  PaginatedStaffResponse,
  User,
} from "@/types/auth";

export const userService = {
  async getStaffUsers(params?: {
    search?: string;
    role?: "Backoffice" | "GridOperator";
    status?: string;
    sortField?: "name" | "email" | "role" | "status";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  }): Promise<PaginatedStaffResponse> {
    const response = await apiClient.get<PaginatedStaffResponse>("/staff", {
      params: {
        search: params?.search || undefined,
        role: params?.role || undefined,
        status: params?.status || undefined,
        sortField: params?.sortField || "name",
        sortOrder: params?.sortOrder || "asc",
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    });
    return response.data;
  },

  async getProsumers(params?: {
    search?: string;
    status?: string;
    sortField?: "name" | "email" | "status";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  }): Promise<PaginatedProsumerResponse> {
    const response = await apiClient.get<PaginatedProsumerResponse>(
      "/prosumers",
      {
        params: {
          search: params?.search || undefined,
          status: params?.status || undefined,
          sortField: params?.sortField || "name",
          sortOrder: params?.sortOrder || "asc",
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      },
    );
    return response.data;
  },

  async createStaffUser(request: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>("/staff", request);
    return response.data;
  },

  async createProsumer(request: CreateProsumerRequest): Promise<User> {
    const response = await apiClient.post<User>("/prosumers", request);
    return response.data;
  },

  async updateStaffStatus(
    userId: string,
    accountStatus: "Active" | "Deactivated",
  ): Promise<User> {
    const response = await apiClient.patch<User>(`/staff/${userId}/status`, {
      accountStatus,
    });
    return response.data;
  },

  async updateProsumerStatus(
    userId: string,
    accountStatus: "Active" | "Deactivated",
  ): Promise<User> {
    const response = await apiClient.patch<User>(
      `/prosumers/${userId}/status`,
      {
        accountStatus,
      },
    );
    return response.data;
  },
};
