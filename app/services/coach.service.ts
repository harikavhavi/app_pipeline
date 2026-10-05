/**
 * coach.service.ts
 */
import { API_BASE } from './api';
import { Session } from '../types';
import { Athlete, ConnectionRequest, SessionRequest } from '../types';

export const coachService = {
  getRoster: async (_coachId?: string): Promise<Athlete[]> => {
    return [];
  },

  getSession: async (_sessionId: string): Promise<Session | null> => {
    return null;
  },

  compareSession: async (sessionAId: string, sessionBId: string) => {
    // No data yet — return empty delta
    return { sessionAId, sessionBId, delta: [] };
  },

  assignDrill: async (athleteId: string, drillId: string) => {
    await new Promise(r => setTimeout(r, 300));
    return { status: 'assigned', athleteId, drillId };
  },

  /** Coach accepts/declines a pending request from an athlete. */
  respond: async (athleteId: string, coachId: string, status: 'accepted' | 'declined'): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/athletes/${athleteId}/coaches/${coachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Pending incoming requests for this coach. */
  getRequests: async (coachId: string): Promise<ConnectionRequest[]> => {
    try {
      const res = await fetch(`${API_BASE}/coaches/${coachId}/requests`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests ?? [];
    } catch {
      return [];
    }
  },

  /** Athletes with an accepted connection to this coach — powers the Messages list. */
  getConnectedAthletes: async (coachId: string): Promise<Athlete[]> => {
    try {
      const res = await fetch(`${API_BASE}/coaches/${coachId}/athletes`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.athletes ?? [];
    } catch {
      return [];
    }
  },

  /** Ask a connected athlete to record and upload a new session, with an
   * optional note (e.g. "film today's match, full-court view"). */
  requestSession: async (coachId: string, athleteId: string, message?: string): Promise<SessionRequest | null> => {
    try {
      const res = await fetch(`${API_BASE}/coaches/${coachId}/athletes/${athleteId}/session-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message || undefined }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /** Session requests this coach has sent, most recent first. */
  getSessionRequests: async (coachId: string): Promise<SessionRequest[]> => {
    try {
      const res = await fetch(`${API_BASE}/coaches/${coachId}/session-requests`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests ?? [];
    } catch {
      return [];
    }
  },
};
