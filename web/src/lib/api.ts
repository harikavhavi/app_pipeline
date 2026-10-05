export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T,>(path: string) => req<T>(path),
  post: <T,>(path: string, body?: any) =>
    req<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(path: string, body?: any) =>
    req<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string) => req<T>(path, { method: "DELETE" }),
  postForm: async <T,>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
    if (!res.ok) throw new Error(res.statusText);
    return res.json() as Promise<T>;
  },
};

// ─── Domain types (mirror pipeline/database.py) ─────────────────────────────

export type Role = "athlete" | "coach" | "scout" | "federation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  sport?: string | null;
  ipc_class?: string | null;
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  ipc_class: string;
  state?: string | null;
  city?: string | null;
  // Present on GET /athletes and /athletes/{id}; absent on the lighter
  // "connected athletes" summaries returned by /scouts/{id}/athletes etc.
  discoverable?: boolean;
  ipc_verified?: boolean;
  view_count?: number;
  created_at?: string;
  // Only present on GET /athletes — the mean score of the athlete's latest
  // session's metric cards (see api.py:_latest_session_score).
  latest_score?: number | null;
}

export interface ScoutNote {
  id: string;
  scout_id: string;
  athlete_id: string;
  text: string;
  created_at: string;
}

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

export interface AthletePercentile {
  id: string;
  pillar: string;
  label: string;
  percentile: number;
  peer_count: number;
}

export interface AthleteDiscoveryFilters {
  sport?: string;
  ipc_class?: string;
  state?: string;
  min_score?: number;
}

/** Discover athletes (GET /athletes), optionally filtered — powers the scout Discovery page. */
export function discoverAthletes(filters: AthleteDiscoveryFilters = {}): Promise<{ athletes: Athlete[] }> {
  const params = new URLSearchParams({ discoverable_only: "true" });
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.ipc_class) params.set("ipc_class", filters.ipc_class);
  if (filters.state) params.set("state", filters.state);
  if (filters.min_score != null) params.set("min_score", String(filters.min_score));
  return api.get<{ athletes: Athlete[] }>(`/athletes?${params.toString()}`);
}

export interface MetricCard {
  id: string;
  pillar: string;
  label: string;
  value: number | string;
  unit?: string | null;
  score?: number | null;
  higher_is_better: boolean;
}

export interface SessionSummary {
  id: string;
  athlete_id: string;
  sport: string;
  ipc_class: string;
  date: string;
  created_at: string;
  video_metadata: {
    filename?: string;
    duration_sec?: number;
    has_video?: boolean;
  };
  metric_cards?: MetricCard[];
  // {"scout_feedback": str, "coach_feedback": str, "ai_log": [...]} — see
  // pipeline/src/pipeline/adapter.py build_feedback() /
  // pipeline/src/llm/gemini_client.py generate_feedback().
  feedback?: { scout_feedback?: string; coach_feedback?: string; ai_log?: { msg: string; type: string }[] };
}

export type TrainingStatus = "assigned" | "in_progress" | "completed";

export interface TrainingAssignment {
  id: string;
  coach_id: string;
  athlete_id: string;
  title: string;
  description?: string | null;
  target_pillar?: string | null;
  due_date?: string | null;
  status: TrainingStatus;
  created_at: string;
}

export function avgScore(cards?: MetricCard[]): number {
  const scored = (cards ?? []).filter((c) => c.score != null);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((s, c) => s + (c.score as number), 0) / scored.length);
}

export function groupByPillar(cards: MetricCard[]): [string, MetricCard[]][] {
  const map = new Map<string, MetricCard[]>();
  for (const c of cards) {
    if (!map.has(c.pillar)) map.set(c.pillar, []);
    map.get(c.pillar)!.push(c);
  }
  return Array.from(map.entries());
}

// ─── Chart data shaping ──────────────────────────────────────────────────────
// Sessions already carry every metric_card per session (see /sessions/{id}),
// so trend/comparison charts are built client-side from that — no separate
// history endpoint needed.

export interface MetricMeta {
  id: string;
  label: string;
  pillar: string;
  unit?: string | null;
}

/** Every distinct metric that appears anywhere in a set of sessions, in pillar order. */
export function catalogMetrics(sessions: SessionSummary[]): MetricMeta[] {
  const seen = new Map<string, MetricMeta>();
  for (const s of sessions) {
    for (const c of s.metric_cards ?? []) {
      if (!seen.has(c.id)) seen.set(c.id, { id: c.id, label: c.label, pillar: c.pillar, unit: c.unit });
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.pillar.localeCompare(b.pillar) || a.label.localeCompare(b.label));
}

/** One athlete's value for `metricId` across their sessions, oldest → newest, for a trend line. */
export function metricTrend(sessions: SessionSummary[], metricId: string): { label: string; value: number }[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    .map((s) => {
      const card = (s.metric_cards ?? []).find((c) => c.id === metricId);
      return card && typeof card.value === "number" ? { label: s.date, value: card.value } : null;
    })
    .filter((v): v is { label: string; value: number } => v !== null);
}

/** Overall (avg-of-scores) session score across an athlete's sessions, oldest → newest. */
export function scoreTrend(sessions: SessionSummary[]): { label: string; value: number }[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
    .map((s) => ({ label: s.date, value: avgScore(s.metric_cards) }));
}

/** Latest score (0-100) per metric for one athlete — used as one side of a comparison bar chart. */
export function latestMetricScores(sessions: SessionSummary[]): Map<string, number> {
  const latest = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))[0];
  const map = new Map<string, number>();
  for (const c of latest?.metric_cards ?? []) {
    if (c.score != null) map.set(c.id, c.score);
  }
  return map;
}

/**
 * Average score (0-100) per pillar, from the athlete's latest session —
 * the radar-chart axes for comparing 3+ athletes at once (see
 * MultiCompareView), where showing every individual metric per athlete
 * would be unreadable.
 */
export function latestPillarAverages(sessions: SessionSummary[]): Map<string, number> {
  const latest = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))[0];
  const byPillar = groupByPillar(latest?.metric_cards ?? []);
  const map = new Map<string, number>();
  for (const [pillar, cards] of byPillar) {
    map.set(pillar, avgScore(cards));
  }
  return map;
}
