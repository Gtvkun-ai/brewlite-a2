'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  clearAuth,
  fetchMeApi,
  getStoredToken,
  getStoredUser,
  loginApi,
  LoginPayload,
  registerApi,
  RegisterPayload,
} from '../lib/auth-api';
import type { AuthResponse } from '../lib/types';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const authGeneration = useRef(0);

  useEffect(() => {
    const generation = ++authGeneration.current;
    let active = true;
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        setUser(savedUser);
      }
      void fetchMeApi().then((freshUser) => {
        if (!active || generation !== authGeneration.current) return;
        setUser(freshUser);
        if (!freshUser) setToken(null);
      }).finally(() => {
        if (active && generation === authGeneration.current) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    return () => { active = false; };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    ++authGeneration.current;
    setIsLoading(true);
    try {
      const res = await loginApi(payload);
      setToken(res.accessToken);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    ++authGeneration.current;
    setIsLoading(true);
    try {
      const res = await registerApi(payload);
      setToken(res.accessToken);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    ++authGeneration.current;
    clearAuth();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const generation = authGeneration.current;
    const fresh = await fetchMeApi();
    if (generation !== authGeneration.current) return;
    setUser(fresh);
    if (!fresh) setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
