/**
 * auth.service.ts
 * Real accounts backed by the pipeline's SQLite users table (see pipeline/database.py).
 * Prototype-grade: no email format / password-strength validation is enforced,
 * but every signup/login is a real, persisted account.
 */
import { API_BASE } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  sport?: string;
  ipc_class?: string;
  [key: string]: any;
}

async function post(path: string, body: any): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "Request failed");
  return data as AuthUser;
}

export const authService = {
  login: async (email: string, password: string, _role: string): Promise<AuthUser> => {
    if (!email || !password) throw new Error("Email and password are required");
    return post("/login", { email, password });
  },

  signup: async (data: {
    name: string; email: string; password: string; role: string;
    phone?: string; sport?: string; ipcClass?: string; [key: string]: any;
  }): Promise<AuthUser> => {
    if (!data.name || !data.email || !data.password || !data.role) {
      throw new Error("Name, email, password and role are required");
    }
    const { name, email, password, role, phone, sport, ipcClass, ...rest } = data;
    return post("/signup", {
      name, email, password, role, phone, sport,
      ipc_class: ipcClass,
      extra: Object.keys(rest).length ? rest : undefined,
    });
  },

  logout: async () => {
    // Stateless (no server-side session/token) — nothing to invalidate remotely.
  },
};
