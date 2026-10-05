/**
 * athlete.service.ts
 * Fetches athlete profiles and session history from the pipeline API.
 * Falls back to mock data if the API is unreachable.
 */
import { API_BASE } from "./api";
import { Session } from "../types";
import { Athlete } from "../types";
import { Coach } from "../types";
import { AthleteMetricsSummary } from "../types";
import { SessionRequest, AppNotification } from "../types";

// ─── Types (mirrors pipeline database schema) ─────────────────────────────────
export interface ApiSession {
  id: string;
  athlete_id: string;
  sport: string;
  ipc_class: string;
  date: string;
  created_at: string;
  video_metadata: {
    filename?: string;
    duration_sec?: number;
    fps?: number;
    resolution?: string;
    camera_angle?: string;
    pixel_per_meter?: number;
    frames_analysed?: number;
    pose_confidence_avg?: number;
    framing_feedback?: { quality: 'good' | 'partial' | 'poor'; message: string | null; tips: string[] } | null;
  };
  metric_cards?: any[];
  feedback?: { scout_feedback?: string; coach_feedback?: string; athlete_feedback?: string };
  ai_log?: { msg: string; type: string }[];
  processing_meta?: {
    pipeline_version?: string;
    processing_time_sec?: number;
    pillars_computed?: number;
    total_metric_cards?: number;
    is_estimated?: boolean;
  };
}

// ─── Map API session → app Session shape ──────────────────────────────────────
function mapApiSession(s: ApiSession): Session {
  const vm = s.video_metadata ?? {};
  const pm = s.processing_meta ?? {};
  const cards = s.metric_cards ?? [];
  const scored = cards.filter((c: any) => c.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum: number, c: any) => sum + c.score, 0) / scored.length)
    : 0;
  return {
    id:           s.id,
    athleteId:    s.athlete_id,
    sport:        s.sport,
    sportLabel:   (s.sport ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    ipcClass:     s.ipc_class,
    date:         s.date,
    duration:     vm.duration_sec ? `${Math.round(vm.duration_sec / 60)}m ${Math.round(vm.duration_sec % 60)}s` : "—",
    videoFile:    vm.filename,
    overallScore: avgScore,
    score:        avgScore,
    metricCards:  cards,
    aiLog:        (s.ai_log ?? []).map(l => ({ msg: l.msg, type: l.type as "good" | "warn" })),
    feedback:     {
      scout_feedback: s.feedback?.scout_feedback ?? '',
      coach_feedback: s.feedback?.coach_feedback ?? '',
      athlete_feedback: s.feedback?.athlete_feedback,
    },
    isEstimated:  pm.is_estimated ?? false,
    framingFeedback: vm.framing_feedback ?? null,
  };
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} at ${path}`);
  return res.json() as Promise<T>;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const athleteService = {
  /**
   * Get an athlete's profile.
   * Tries the API first; falls back to mock.
   */
  getProfile: async (id: string) => {
    try {
      return await apiFetch<any>(`/athletes/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Get all sessions for an athlete from the DB (newest first).
   * Falls back to mock sessions if API unavailable.
   */
  getSessions: async (athleteId: string): Promise<Session[]> => {
    try {
      const data = await apiFetch<{ sessions: any[] }>(`/sessions/${athleteId}`);
      return data.sessions.map(mapApiSession);
    } catch {
      return [];
    }
  },

  /**
   * Get one full session (with all metric_cards).
   */
  getSession: async (sessionId: string): Promise<Session | null> => {
    try {
      const s = await apiFetch<ApiSession>(`/session/${sessionId}`);
      return mapApiSession(s);
    } catch {
      return null;
    }
  },

  /**
   * Upload video stub (actual upload goes through analysis.service → POST /analyse).
   */
  uploadVideo: async (_file: any) => {
    await new Promise(r => setTimeout(r, 300));
    return { uploadId: `upload_${Date.now()}`, status: "uploaded" };
  },

  /**
   * Get all registered coaches (for the Coach Network browse screen).
   */
  getCoaches: async (): Promise<Coach[]> => {
    try {
      const data = await apiFetch<{ coaches: Coach[] }>(`/coaches`);
      return data.coaches ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Get the coaches this athlete is already connected to.
   */
  getMyCoaches: async (athleteId: string): Promise<Coach[]> => {
    try {
      const data = await apiFetch<{ coaches: Coach[] }>(`/athletes/${athleteId}/coaches`);
      return data.coaches ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Career-level aggregate: average + best score per metric across all sessions.
   */
  getMetricsSummary: async (athleteId: string): Promise<AthleteMetricsSummary | null> => {
    try {
      return await apiFetch<AthleteMetricsSummary>(`/athletes/${athleteId}/metrics/summary`);
    } catch {
      return null;
    }
  },

  /**
   * Send a connection request from an athlete to a coach (starts "pending"
   * until the coach accepts).
   */
  connectCoach: async (athleteId: string, coachId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/athletes/${athleteId}/coaches/${coachId}`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Bump this athlete's profile-view counter. Fire-and-forget — called when
   * a scout/coach opens the athlete's profile; failures are non-fatal.
   */
  recordView: async (athleteId: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/athletes/${athleteId}/view`, { method: "POST" });
    } catch {
      // Non-fatal — the profile screen doesn't depend on this succeeding.
    }
  },

  /**
   * All scout connections for this athlete (any status) — used to compute
   * the "Connections" and "Match Rate" stats on the athlete home screen.
   */
  getScouts: async (athleteId: string): Promise<{ status: string }[]> => {
    try {
      const data = await apiFetch<{ scouts: { status: string }[] }>(`/athletes/${athleteId}/scouts`);
      return data.scouts ?? [];
    } catch {
      return [];
    }
  },

  /**
   * All coach connections for this athlete (any status) — same purpose as
   * getScouts, mirrored for coaches.
   */
  getConnectedCoachRequests: async (athleteId: string): Promise<{ status: string }[]> => {
    try {
      const data = await apiFetch<{ coaches: { status: string }[] }>(`/athletes/${athleteId}/coaches`);
      return data.coaches ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Session-recording requests from connected coaches (e.g. "film today's
   * match"). Optionally filter by status ("pending" for the notifications feed).
   */
  getSessionRequests: async (athleteId: string, status?: string): Promise<SessionRequest[]> => {
    try {
      const qs = status ? `?status=${status}` : "";
      const data = await apiFetch<{ requests: SessionRequest[] }>(`/athletes/${athleteId}/session-requests${qs}`);
      return data.requests ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Decline a coach's session request (fulfilling one instead happens
   * automatically by passing session_request_id to analysisService.analyse).
   */
  declineSessionRequest: async (requestId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/session-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Real in-app notifications for this user — see pipeline database.py
   * Notification (currently fired on: connected athlete uploads a session).
   * Falls back to an empty list, never mock data, since a wrong/fake
   * notification is worse than none.
   */
  getNotifications: async (userId: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> => {
    try {
      const data = await apiFetch<{ notifications: AppNotification[]; unread_count: number }>(`/users/${userId}/notifications`);
      return { notifications: data.notifications ?? [], unreadCount: data.unread_count ?? 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },
};
