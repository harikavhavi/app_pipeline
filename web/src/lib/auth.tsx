"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, Role, User } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    sport?: string;
    ipc_class?: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "parasync-web-auth";

// Athlete accounts exist in the shared backend (for the mobile app) but are
// refused here — this site is for scout/federation/coach portals only.
export const ALLOWED_ROLES: Role[] = ["scout", "federation", "coach"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = useCallback((u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await api.post<any>("/login", { email, password });
      if (!ALLOWED_ROLES.includes(u.role)) {
        throw new Error("This site is for scouts, coaches, and federations only. Athlete accounts use the ParaSync mobile app.");
      }
      const mapped: User = { id: u.id, name: u.name, email: u.email, role: u.role, sport: u.sport, ipc_class: u.ipc_class };
      persist(mapped);
      return mapped;
    },
    [persist]
  );

  const signup = useCallback(
    async (payload: { name: string; email: string; password: string; role: Role; sport?: string; ipc_class?: string }) => {
      if (!ALLOWED_ROLES.includes(payload.role)) {
        throw new Error("This site only supports scout, coach, and federation accounts.");
      }
      const u = await api.post<any>("/signup", payload);
      const mapped: User = { id: u.id, name: u.name, email: u.email, role: u.role, sport: u.sport, ipc_class: u.ipc_class };
      persist(mapped);
      return mapped;
    },
    [persist]
  );

  const logout = useCallback(() => persist(null), [persist]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
