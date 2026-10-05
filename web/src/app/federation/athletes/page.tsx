"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api, Athlete, avgScore } from "@/lib/api";
import { Card, ScoreRing, Input, Spinner, EmptyState } from "@/components/ui";
import { IconUsers, IconCheck } from "@/components/icons";

interface Row extends Athlete { latestScore?: number; sessionCount?: number }

export default function FederationAthletesPage() {
  const [athletes, setAthletes] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ athletes: Athlete[] }>("/athletes").then(async (d) => {
      const withScores = await Promise.all(
        d.athletes.map(async (a) => {
          try {
            const s = await api.get<{ sessions: any[] }>(`/sessions/${a.id}`);
            const latest = s.sessions[0];
            return { ...a, latestScore: latest ? avgScore(latest.metric_cards) : undefined, sessionCount: s.sessions.length };
          } catch {
            return a;
          }
        })
      );
      setAthletes(withScores);
      setLoading(false);
    });
  }, []);

  const filtered = athletes.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.sport?.toLowerCase().includes(q.toLowerCase()));

  return (
    <Protected role="federation">
      <AppShell title="All Athletes">
        <Input placeholder="Search by name or sport…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 max-w-md" />

        {loading && <Spinner className="mx-auto my-12" />}
        {!loading && filtered.length === 0 && <EmptyState icon={<IconUsers size={36} />} title="No athletes found" />}

        <div className="grid grid-cols-2 gap-3">
          {!loading &&
            filtered.map((a) => (
              <Link key={a.id} href={`/federation/athlete/${a.id}`}>
                <Card className="p-5 flex items-center justify-between gap-4 hover:border-green/40 transition-colors">
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      {a.name}
                      {a.ipc_verified && <IconCheck size={13} className="text-green shrink-0" />}
                    </div>
                    <div className="text-xs text-t3 capitalize truncate">
                      {a.sport?.replace(/_/g, " ")} · {a.ipc_class} · {a.sessionCount ?? 0} sessions
                    </div>
                  </div>
                  {a.latestScore != null && <ScoreRing score={a.latestScore} size={44} />}
                </Card>
              </Link>
            ))}
        </div>
      </AppShell>
    </Protected>
  );
}
