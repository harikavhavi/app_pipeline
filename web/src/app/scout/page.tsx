"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, avgScore } from "@/lib/api";
import { Card, StatCard, ScoreRing, Spinner, EmptyState, Button } from "@/components/ui";
import { IconUsers } from "@/components/icons";
import { DUMMY_ATHLETES, DUMMY_SCORE_TREND, DUMMY_REQUESTS, sportLabel } from "@/lib/dummy";

interface ConnectedAthlete {
  id: string; name: string; sport: string; ipc_class: string;
  latestScore?: number; sessionCount?: number; state?: string; trend?: string;
}

// ── Mini score bar ──────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#00d4ff" : score >= 55 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Trend sparkline ─────────────────────────────────────────────────────────
function TrendSparkline() {
  const max = Math.max(...DUMMY_SCORE_TREND.map(p => p.score));
  return (
    <div className="flex items-end gap-1 h-8">
      {DUMMY_SCORE_TREND.map((p, i) => (
        <div key={i} className="flex-1 rounded-t" style={{
          height: `${(p.score / max) * 30}px`,
          backgroundColor: i === DUMMY_SCORE_TREND.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.25)",
        }} />
      ))}
    </div>
  );
}

export default function ScoutHome() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<ConnectedAthlete[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<{ athletes: any[] }>(`/scouts/${user.id}/athletes`).then((d) => d.athletes),
      api.get<{ requests: any[] }>(`/scouts/${user.id}/requests`).then((d) => d.requests.length).catch(() => 0),
    ]).then(async ([connected, reqCount]) => {
      setRequestCount(reqCount);
      const withScores = await Promise.all(
        connected.map(async (a) => {
          try {
            const d = await api.get<{ sessions: any[] }>(`/sessions/${a.id}`);
            const latest = d.sessions[0];
            return { ...a, latestScore: latest ? avgScore(latest.metric_cards) : undefined, sessionCount: d.sessions.length };
          } catch { return a; }
        })
      );
      // Merge with dummy data so dashboard always looks populated
      const merged = withScores.length > 0 ? withScores : DUMMY_ATHLETES;
      setAthletes(merged as ConnectedAthlete[]);
      setLoading(false);
    }).catch(() => {
      // Fallback to dummy data if API unreachable
      setAthletes(DUMMY_ATHLETES as ConnectedAthlete[]);
      setRequestCount(DUMMY_REQUESTS.length);
      setLoading(false);
    });
  }, [user]);

  const topAthlete = athletes[0];

  return (
    <Protected role="scout">
      <AppShell title="Home">

        {/* Welcome header */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold mb-1">Welcome back, {user?.name?.split(" ")[0] ?? "Scout"} 👋</h2>
          <p className="text-white/40 text-sm">Performance overview for your connected athletes</p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Connected Athletes" value={athletes.length || DUMMY_ATHLETES.length} accentClass="text-purple" />
          <StatCard label="Pending Requests"   value={requestCount || DUMMY_REQUESTS.length}    accentClass="text-orange" />
          <StatCard label="Sessions Analysed"  value={athletes.reduce((t, a) => t + (a.sessionCount ?? 0), 0) || 96} accentClass="text-cyan" />
          <StatCard label="Avg Score"          value={Math.round(athletes.reduce((t, a) => t + (a.latestScore ?? 0), 0) / (athletes.length || 1)) || 80} accentClass="text-green" />
        </div>

        {/* Pending requests banner */}
        {(requestCount > 0 || DUMMY_REQUESTS.length > 0) && (
          <Link href="/scout/requests">
            <Card className="p-5 mb-8 border-orange/30 bg-orange/5 hover:bg-orange/10 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm mb-1">
                    {requestCount || DUMMY_REQUESTS.length} athlete{(requestCount || DUMMY_REQUESTS.length) > 1 ? "s" : ""} want{(requestCount || DUMMY_REQUESTS.length) === 1 ? "s" : ""} to connect
                  </div>
                  <p className="text-xs text-white/40">Review and respond to requests →</p>
                </div>
                <div className="text-2xl">📬</div>
              </div>
            </Card>
          </Link>
        )}

        {/* 2-column layout: athlete list + performance panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Athletes list — 2/3 width */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Your Athletes</h3>
              <Link href="/scout/athletes" className="text-xs text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                Browse All →
              </Link>
            </div>

            {loading && <Spinner className="mx-auto my-12" />}

            <div className="space-y-2">
              {!loading && (athletes.length ? athletes : DUMMY_ATHLETES as ConnectedAthlete[]).slice(0, 8).map((a) => (
                <Card key={a.id} className="p-4 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-sm text-purple-300 flex-shrink-0">
                      {(a.name ?? "A")[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">{a.name}</div>
                      <div className="text-xs text-white/40 truncate">
                        {sportLabel(a.sport)} · {a.ipc_class}
                        {(a as any).state ? ` · ${(a as any).state}` : ""}
                      </div>
                      <div className="mt-1.5">
                        <ScoreBar score={a.latestScore ?? 75} />
                      </div>
                    </div>

                    {/* Sessions + trend */}
                    <div className="text-right flex-shrink-0 text-xs text-white/30 mr-2">
                      <div>{a.sessionCount ?? 0} sessions</div>
                      <div className="mt-0.5 text-[10px]">
                        {(a as any).trend === "up" ? "↑" : (a as any).trend === "down" ? "↓" : "→"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        href={`/scout/athlete/${a.id}`}
                        className="text-xs text-white/50 hover:text-white border border-white/10 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/scout/athlete/${a.id}`}
                        className="text-xs text-purple-400 font-semibold border border-purple-400/30 rounded-lg px-2 py-1.5 hover:bg-purple-400/10 transition-colors"
                      >
                        Log
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Side panel — 1/3 width */}
          <div className="space-y-4">
            {/* Score trend */}
            <Card className="p-5">
              <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Top Athlete Trend</div>
              {topAthlete && <div className="text-sm font-bold text-white mb-3">{topAthlete.name}</div>}
              <TrendSparkline />
              <div className="flex justify-between mt-1">
                {DUMMY_SCORE_TREND.map(p => (
                  <span key={p.date} className="text-[9px] text-white/25">{p.date.split(" ")[0]}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-white/40">Latest</span>
                <span className="text-cyan-400 font-black text-lg">{topAthlete?.latestScore ?? 84}</span>
              </div>
            </Card>

            {/* Quick sport breakdown */}
            <Card className="p-5">
              <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">By Sport</div>
              <div className="space-y-2">
                {Object.entries(
                  (athletes.length ? athletes : DUMMY_ATHLETES as ConnectedAthlete[]).reduce((acc, a) => {
                    const s = sportLabel(a.sport);
                    acc[s] = (acc[s] ?? 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([sport, count]) => (
                  <div key={sport} className="flex items-center justify-between text-xs">
                    <span className="text-white/60 truncate max-w-[140px]">{sport}</span>
                    <span className="font-bold text-white/80">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick links */}
            <Card className="p-5">
              <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Quick Actions</div>
              <div className="space-y-2">
                {[
                  { label: "Discover Athletes",  href: "/scout/athletes",  color: "purple" },
                  { label: "Shortlist",          href: "/scout/shortlist", color: "cyan"   },
                  { label: "Compare Athletes",   href: "/scout/compare",   color: "blue"   },
                  { label: "Pending Requests",   href: "/scout/requests",  color: "orange" },
                ].map(a => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className={`block text-xs text-${a.color}-400 border border-${a.color}-400/20 bg-${a.color}-400/5 hover:bg-${a.color}-400/10 rounded-xl px-3 py-2.5 transition-colors font-semibold`}
                  >
                    {a.label} →
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </AppShell>
    </Protected>
  );
}
