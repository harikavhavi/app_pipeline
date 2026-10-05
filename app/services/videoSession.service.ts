/**
 * videoSession.service.ts
 * Handles live video session requests between athletes and coaches.
 * Uses mock data until backend endpoint is available.
 */
import { API_BASE } from './api';
import { VideoSession, VideoSessionStatus } from '../types';

// ─── Local in-memory mock store ───────────────────────────────────────────────
let mockSessions: VideoSession[] = [];

function mockSession(overrides: Partial<VideoSession> = {}): VideoSession {
  return {
    id:           `vs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    athleteId:    overrides.athleteId ?? 'ath_1',
    athleteName:  overrides.athleteName ?? 'Athlete',
    coachId:      overrides.coachId ?? 'coach_1',
    coachName:    overrides.coachName ?? 'Coach',
    title:        overrides.title ?? 'Training Session',
    scheduledAt:  overrides.scheduledAt ?? null,
    status:       overrides.status ?? 'pending',
    meetLink:     overrides.meetLink ?? null,
    recordingUrl: overrides.recordingUrl ?? null,
    durationMin:  overrides.durationMin ?? null,
    notes:        overrides.notes ?? null,
    createdAt:    new Date().toISOString(),
    ...overrides,
  };
}

export const videoSessionService = {
  /** Athlete requests a new live session with their coach */
  async requestSession(
    athleteId: string,
    athleteName: string,
    coachId: string,
    coachName: string,
    title: string,
    scheduledAt?: string,
    notes?: string,
  ): Promise<VideoSession | null> {
    try {
      const res = await fetch(`${API_BASE}/video-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athlete_id: athleteId, coach_id: coachId, title, scheduled_at: scheduledAt, notes }),
      });
      if (!res.ok) throw new Error('API error');
      return res.json();
    } catch {
      // Mock fallback
      const session = mockSession({ athleteId, athleteName, coachId, coachName, title, scheduledAt: scheduledAt ?? null, notes: notes ?? null });
      mockSessions = [session, ...mockSessions];
      return session;
    }
  },

  /** Get all video sessions for an athlete */
  async getAthleteSessions(athleteId: string): Promise<VideoSession[]> {
    try {
      const res = await fetch(`${API_BASE}/video-sessions?athlete_id=${athleteId}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.sessions ?? [];
    } catch {
      return mockSessions.filter(s => s.athleteId === athleteId);
    }
  },

  /** Get all video sessions for a coach */
  async getCoachSessions(coachId: string): Promise<VideoSession[]> {
    try {
      const res = await fetch(`${API_BASE}/video-sessions?coach_id=${coachId}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.sessions ?? [];
    } catch {
      return mockSessions.filter(s => s.coachId === coachId);
    }
  },

  /** Coach accepts or declines a session request */
  async updateStatus(
    sessionId: string,
    status: VideoSessionStatus,
    meetLink?: string,
  ): Promise<VideoSession | null> {
    try {
      const res = await fetch(`${API_BASE}/video-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, meet_link: meetLink }),
      });
      if (!res.ok) throw new Error('API error');
      return res.json();
    } catch {
      const idx = mockSessions.findIndex(s => s.id === sessionId);
      if (idx < 0) return null;
      mockSessions[idx] = { ...mockSessions[idx], status, meetLink: meetLink ?? null };
      return mockSessions[idx];
    }
  },

  /** Mark session as completed and attach recording URL */
  async completeSession(
    sessionId: string,
    recordingUrl: string | null,
    durationMin: number | null,
  ): Promise<VideoSession | null> {
    try {
      const res = await fetch(`${API_BASE}/video-sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_url: recordingUrl, duration_min: durationMin }),
      });
      if (!res.ok) throw new Error('API error');
      return res.json();
    } catch {
      const idx = mockSessions.findIndex(s => s.id === sessionId);
      if (idx < 0) return null;
      mockSessions[idx] = { ...mockSessions[idx], status: 'completed', recordingUrl, durationMin };
      return mockSessions[idx];
    }
  },
};
