"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import AthleteProfileView from "@/components/AthleteProfileView";
import AthleteTrends from "@/components/AthleteTrends";
import ScoutNotesPanel from "@/components/ScoutNotesPanel";
import { useAuth } from "@/lib/auth";
import { api, SessionSummary } from "@/lib/api";
import { EmptyState } from "@/components/ui";
import { IconLock } from "@/components/icons";

export default function ScoutAthletePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sessions" | "trends" | "notes">("sessions");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    api.get<{ sessions: SessionSummary[] }>(`/sessions/${params.id}`).then((d) => setSessions(d.sessions));
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    api.get<any>(`/athletes/${params.id}/scouts`).then((d) => {
      const mine = (d.scouts ?? []).find((c: any) => c.id === user.id);
      setStatus(mine?.status);
    });
  }, [user, params.id]);

  return (
    <Protected role="scout">
      <AppShell title="Athlete Profile">
        <div className="flex gap-2 mb-6 max-w-4xl">
          {(["sessions", "trends", "notes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-purple/12 text-purple border border-purple/30" : "text-t2 border border-border hover:bg-card"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "sessions" && <AthleteProfileView role="scout" athleteId={params.id} />}
        {tab === "trends" && (
          status === "accepted" ? (
            <div className="max-w-4xl">
              <AthleteTrends sessions={sessions} accentColor="#a78bfa" />
            </div>
          ) : (
            <EmptyState icon={<IconLock size={32} />} title="Connect with this athlete to view their performance trends" />
          )
        )}
        {tab === "notes" && user && (
          <div className="max-w-2xl">
            <ScoutNotesPanel scoutId={user.id} athleteId={params.id} />
          </div>
        )}
      </AppShell>
    </Protected>
  );
}
