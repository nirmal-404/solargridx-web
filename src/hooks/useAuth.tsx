/* eslint-disable react-refresh/only-export-components */
// Smart Solar Microgrid Trading System - Authentication Context & Hook
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { authService } from '@/services/authService';
import type { LoginRequest, User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  isProsumer: boolean;
  isBackoffice: boolean;
  isGridOperator: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('solargridx_token'));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('solargridx_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Syncs user profile with the server on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await authService.getCurrentUser();
        setUser(profile);
        localStorage.setItem('solargridx_user', JSON.stringify(profile));
      } catch {
        // Token expired or invalid
        localStorage.removeItem('solargridx_token');
        localStorage.removeItem('solargridx_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const authToken = response.accessToken || response.token || '';
      localStorage.setItem('solargridx_token', authToken);
      localStorage.setItem('solargridx_user', JSON.stringify(response.user));
      setToken(authToken);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('solargridx_token');
    localStorage.removeItem('solargridx_user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role ?? null;
  const isProsumer = role === 'Prosumer';
  const isBackoffice = role === 'Backoffice';
  const isGridOperator = role === 'GridOperator';
  const isStaff = isBackoffice || isGridOperator;

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      isProsumer,
      isBackoffice,
      isGridOperator,
      isStaff,
    }),
    [user, token, role, isLoading, isProsumer, isBackoffice, isGridOperator, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
