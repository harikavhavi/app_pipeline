/**
 * scout.service.ts
 */
import { API_BASE } from './api';
import { Athlete } from '../types';
import { Scout, ConnectionRequest } from '../types';

export const scoutService = {
  browseAthletes: async (_filters?: any): Promise<Athlete[]> => {
    // TODO: GET /athletes from pipeline API once endpoint returns full profiles
    return [];
  },

  getScouts: async (): Promise<Scout[]> => {
    try {
      const res = await fetch(`${API_BASE}/scouts`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.scouts ?? [];
    } catch {
      return [];
    }
  },

  getMyScouts: async (athleteId: string): Promise<Scout[]> => {
    try {
      const res = await fetch(`${API_BASE}/athletes/${athleteId}/scouts`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.scouts ?? [];
    } catch {
      return [];
    }
  },

  /** Athlete sends a connection request to a scout (starts "pending"). */
  connect: async (athleteId: string, scoutId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/athletes/${athleteId}/scouts/${scoutId}`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Scout accepts/declines a pending request from an athlete. */
  respond: async (athleteId: string, scoutId: string, status: 'accepted' | 'declined'): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/athletes/${athleteId}/scouts/${scoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Pending incoming requests for this scout. */
  getRequests: async (scoutId: string): Promise<ConnectionRequest[]> => {
    try {
      const res = await fetch(`${API_BASE}/scouts/${scoutId}/requests`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests ?? [];
    } catch {
      return [];
    }
  },

  /** Athletes with an accepted connection to this scout — powers the Messages list. */
  getConnectedAthletes: async (scoutId: string): Promise<Athlete[]> => {
    try {
      const res = await fetch(`${API_BASE}/scouts/${scoutId}/athletes`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.athletes ?? [];
    } catch {
      return [];
    }
  },

  shortlist: async (athleteId: string) => {
    await new Promise(r => setTimeout(r, 300));
    return { status: 'shortlisted', athleteId };
  },
};
