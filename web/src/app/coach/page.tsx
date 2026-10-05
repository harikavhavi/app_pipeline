"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, avgScore } from "@/lib/api";
import { Card, StatCard, ScoreRing, Spinner, EmptyState, Button } from "@/components/ui";
import { IconUsers, IconClock } from "@/components/icons";

interface ConnectedAthlete { id: string; name: string; sport: string; ipc_class: string; latestScore?: number; sessionCount?: number }

export default function CoachHome() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<ConnectedAthlete[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [activeAssignments, setActiveAssignments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<{ athletes: any[] }>(`/coaches/${user.id}/athletes`).then((d) => d.athletes),
      api.get<{ requests: any[] }>(`/coaches/${user.id}/requests`).then((d) => d.requests.length).catch(() => 0),
      api.get<{ assignments: any[] }>(`/coaches/${user.id}/training`)
        .then((d) => d.assignments.filter((a) => a.status !== "completed").length)
        .catch(() => 0),
    ]).then(async ([connected, reqCount, activeCount]) => {
      setRequestCount(reqCount);
      setActiveAssignments(activeCount);
      const withScores = await Promise.all(
        connected.map(async (a) => {
          try {
            const d = await api.get<{ sessions: any[] }>(`/sessions/${a.id}`);
            const latest = d.sessions[0];
            return { ...a, latestScore: latest ? avgScore(latest.metric_cards) : undefined, sessionCount: d.sessions.length };
          } catch {
            return a;
          }
        })
      );
      setAthletes(withScores);
      setLoading(false);
    });
  }, [user]);

  return (
    <Protected role="coach">
      <AppShell title="Home">
        <h2 className="text-2xl font-extrabold mb-1">Welcome, {user?.name.split(" ")[0]}</h2>
        <p className="text-t3 text-sm mb-6">Performance overview for your connected athletes</p>

        <div className="flex gap-4 mb-8">
          <StatCard label="Connected Athletes" value={athletes.length} accentClass="text-blue" />
          <StatCard label="Active Training Plans" value={activeAssignments} accentClass="text-blue" />
          <StatCard label="Pending Requests" value={requestCount} accentClass="text-orange" />
        </div>

        {requestCount > 0 && (
          <Link href="/coach/requests">
            <Card className="p-5 mb-8 border-orange/30 bg-orange/5 hover:bg-orange/10 transition-colors cursor-pointer">
              <div className="font-semibold text-sm mb-1">
                {requestCount} athlete{requestCount > 1 ? "s" : ""} want{requestCount === 1 ? "s" : ""} to connect
              </div>
              <p className="text-xs text-t3">Review and respond to requests →</p>
            </Card>
          </Link>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Your Athletes</h3>
          <Link href="/coach/athletes" className="text-xs text-blue font-semibold">View All</Link>
        </div>

        {loading && <Spinner className="mx-auto my-12" />}
        {!loading && athletes.length === 0 && (
          <EmptyState
            icon={<IconUsers size={36} />}
            title="No connected athletes yet"
            sub="Accept incoming connection requests to start coaching athletes here"
            action={<Link href="/coach/requests"><Button variant="secondary" accent="blue">View Requests</Button></Link>}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          {!loading &&
            athletes.slice(0, 6).map((a) => (
              <Link key={a.id} href={`/coach/athlete/${a.id}`}>
                <Card className="p-4 flex items-center justify-between gap-3 hover:border-blue/40 transition-colors">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{a.name}</div>
                    <div className="text-xs text-t3 capitalize truncate">
                      {a.sport?.replace(/_/g, " ")} · {a.sessionCount ?? 0} sessions
                    </div>
                  </div>
                  {a.latestScore != null && <ScoreRing score={a.latestScore} size={38} />}
                </Card>
              </Link>
            ))}
        </div>
      </AppShell>
    </Protected>
  );
}
