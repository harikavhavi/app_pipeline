/**
 * types/index.ts — ParaSync 2.0 canonical type definitions.
 * All types previously spread across mock-*.ts files live here.
 */

// ─── Core analysis types ───────────────────────────────────────────────────────
export interface MetricCard {
  id: string;
  pillar: string;
  label: string;
  value: number | string | boolean;
  unit: string | null;
  score: number | null;
  higher_is_better: boolean | null;
  trend: number | null;
  trend_unit: string | null;
}

export interface FramingFeedback {
  quality: 'good' | 'partial' | 'poor';
  message: string | null;
  tips: string[];
}

export interface Session {
  id: string;
  athleteId: string;
  date: string;
  duration: string;
  sport: string;
  sportLabel: string;
  ipcClass: string;
  videoFile?: string;
  overallScore: number;
  /** Alias for overallScore — used by SessionCard, videos, history screens */
  score?: number;
  metricCards: MetricCard[];
  feedback: { scout_feedback: string; coach_feedback: string; athlete_feedback?: string };
  aiLog: { msg: string; type: 'good' | 'warn' }[];
  /** True when the pipeline failed and these are preliminary fallback scores, not a real measurement */
  isEstimated?: boolean;
  /** Set when the camera framing made metrics unreliable — see pipeline api.py _framing_feedback() */
  framingFeedback?: FramingFeedback | null;
}

// ─── Metrics summary (career aggregate) ────────────────────────────────────────
export interface MetricSummary {
  id: string;
  pillar: string;
  label: string;
  unit: string | null;
  avg_score: number;
  best_score: number;
  best_value: number | string | null;
}

export interface AthleteMetricsSummary {
  athlete_id: string;
  sessions_count: number;
  overall_avg: number | null;
  overall_best: number | null;
  metrics: MetricSummary[];
}

// ─── Athlete ───────────────────────────────────────────────────────────────────
export interface Athlete {
  id: string;
  name: string;
  sport: string;
  sportLabel: string;
  ipcClass: string;
  state: string;
  age: number;
  verified: boolean;
  scoutReady: boolean;
  top100: boolean;
  sessions: number;
  avgScore: number;
  bestScore: number;
  matchRate: number;
  views: number;
  connections: number;
  bio: string;
  injuryStatus: 'clear' | 'monitor' | 'risk';
  coachId: string | null;
  /** RSI risk level derived from injury status */
  rsiLevel: 'LOW' | 'MED' | 'HIGH';
  /** Whether athlete has opted into public discovery */
  discoverable: boolean;
  /** Scout profile view count alias */
  scoutViews?: number;
}

// ─── Connection status (athlete <-> scout/coach) ───────────────────────────────
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

// ─── Scout / Scout Activity ────────────────────────────────────────────────────
export interface Scout {
  id: string;
  name: string;
  org: string;
  role: string;
  sports: string[];
  level: string;
  verified: boolean;
  athletes: number;
  /** Present when returned from an athlete's connection list — undefined means no connection yet */
  status?: ConnectionStatus;
}

// ─── Coach ──────────────────────────────────────────────────────────────────
export interface Coach {
  id: string;
  name: string;
  federation: string;
  sport: string;
  experience: string;
  certification: string;
  /** Present when returned from an athlete's connection list — undefined means no connection yet */
  status?: ConnectionStatus;
}

// ─── Connection request (scout/coach-facing incoming request) ─────────────────
export interface ConnectionRequest {
  id: string;           // athlete id
  name: string;
  sport: string;
  ipc_class: string;
  requested_at: string;
}

// ─── Chat ───────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  thread_type: 'scout' | 'coach';
  athlete_id: string;
  counterpart_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ScoutActivity {
  id: string;
  scoutId: string;
  scoutName: string;
  scoutOrg: string;
  action: 'view' | 'connect' | 'shortlist';
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

// ─── Session request (coach asks athlete to film a new session) ──────────────
export interface SessionRequest {
  id: string;
  coach_id: string;
  athlete_id: string;
  message: string | null;
  status: 'pending' | 'fulfilled' | 'declined';
  fulfilled_session_id: string | null;
  created_at: string;
}

// ─── Notification ──────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  athlete_id?: string | null;
  session_id?: string | null;
  read: boolean;
  created_at: string;
}

// ─── Drill ────────────────────────────────────────────────────────────────────
export interface Drill {
  id: string;
  title: string;
  /** Alias for title — used by coach drill screens */
  name?: string;
  category: string;
  /** Alias for category — used by coach drill screens */
  pillar?: string;
  duration: string;
  target: string;
  description: string;
}

// ─── Video Session (live coach-athlete meet) ───────────────────────────────────
export type VideoSessionStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'cancelled';

export interface VideoSession {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  coachName: string;
  title: string;
  scheduledAt: string | null;
  status: VideoSessionStatus;
  meetLink: string | null;
  recordingUrl: string | null;
  durationMin: number | null;
  notes: string | null;
  createdAt: string;
}

// ─── Smartwatch / Wearable Health Metrics ─────────────────────────────────────
export interface WatchMetrics {
  connected: boolean;
  deviceName: string | null;
  lastSync: string | null;
  heartRate: number | null;       // bpm
  hrv: number | null;             // ms
  spo2: number | null;            // %
  steps: number | null;
  activeMinutes: number | null;
  calories: number | null;
  stressScore: number | null;     // 0-100
}

// ─── Athlete Log Entry (Scout / Coach notes) ───────────────────────────────────
export type LogEntryTag = 'strength' | 'concern' | 'improvement' | 'observation' | 'milestone';

export interface AthleteLogEntry {
  id: string;
  authorId: string;
  authorRole: 'coach' | 'scout';
  athleteId: string;
  sessionId: string | null;
  date: string;
  note: string;
  tags: LogEntryTag[];
  createdAt: string;
}

// ─── AI Chatbot Message ───────────────────────────────────────────────────────
export type AIChatRole = 'user' | 'assistant';

export interface AIChatMessage {
  id: string;
  role: AIChatRole;
  content: string;
  timestamp: string;
}

