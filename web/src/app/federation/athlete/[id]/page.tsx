"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import AthleteTrends from "@/components/AthleteTrends";
import { api, Athlete, SessionSummary, avgScore } from "@/lib/api";
import { Card, Badge, Button, SessionRow, Spinner, EmptyState } from "@/components/ui";
import { IconVideo, IconCheck } from "@/components/icons";

export default function FederationAthletePage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<"sessions" | "trends">("sessions");
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Athlete>(`/athletes/${params.id}`).catch(() => null),
      api.get<{ sessions: SessionSummary[] }>(`/sessions/${params.id}`).then((d) => d.sessions).catch(() => []),
    ]).then(([a, s]) => {
      setAthlete(a);
      setSessions(s);
      setLoading(false);
    });
  }, [params.id]);

  async function toggleVerified() {
    if (!athlete) return;
    setVerifying(true);
    try {
      const updated = await api.patch<Athlete>(`/athletes/${athlete.id}/verify`, { verified: !athlete.ipc_verified });
      setAthlete(updated);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <Protected role="federation">
        <AppShell title="Athlete Profile"><Spinner className="mx-auto my-16" /></AppShell>
      </Protected>
    );
  }

  return (
    <Protected role="federation">
      <AppShell title="Athlete Profile">
        <div className="max-w-4xl">
          {athlete && (
            <Card className="p-6 flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-green/15 border-2 border-green flex items-center justify-center text-xl font-extrabold text-green">
                {athlete.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold flex items-center gap-2">
                  {athlete.name}
                  {athlete.ipc_verified && <Badge tone="green">Verified</Badge>}
                </div>
                <div className="text-sm text-t3 capitalize">
                  {athlete.sport?.replace(/_/g, " ")} · {athlete.ipc_class} · {sessions.length} sessions
                </div>
              </div>
              <Button
                variant="secondary"
                accent={athlete.ipc_verified ? "green" : "cyan"}
                disabled={verifying}
                onClick={toggleVerified}
              >
                <IconCheck size={14} />
                {athlete.ipc_verified ? "Verified — click to unverify" : "Mark classification verified"}
              </Button>
            </Card>
          )}

          <div className="flex gap-2 mb-6">
            {(["sessions", "trends"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                  tab === t ? "bg-green/12 text-green border border-green/30" : "text-t2 border border-border hover:bg-card"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "sessions" ? (
            sessions.length === 0 ? (
              <EmptyState icon={<IconVideo size={32} />} title="No sessions uploaded yet" />
            ) : (
              sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  href={`/federation/session/${s.id}`}
                  sport={s.sport}
                  date={s.date}
                  duration={s.video_metadata?.duration_sec ? `${Math.round(s.video_metadata.duration_sec)}s` : undefined}
                  score={avgScore(s.metric_cards)}
                  subtitle={s.video_metadata?.filename}
                />
              ))
            )
          ) : (
            <AthleteTrends sessions={sessions} accentColor="#34d399" />
          )}
        </div>
      </AppShell>
    </Protected>
  );
}
