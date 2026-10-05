"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import AthleteProfileView from "@/components/AthleteProfileView";
import AthleteTrends from "@/components/AthleteTrends";
import TrainingPanel from "@/components/TrainingPanel";
import { useAuth } from "@/lib/auth";
import { api, SessionSummary } from "@/lib/api";
import { EmptyState } from "@/components/ui";
import { IconLock } from "@/components/icons";

export default function CoachAthletePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sessions" | "trends" | "training">("sessions");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    api.get<{ sessions: SessionSummary[] }>(`/sessions/${params.id}`).then((d) => setSessions(d.sessions));
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    api.get<any>(`/athletes/${params.id}/coaches`).then((d) => {
      const mine = (d.coaches ?? []).find((c: any) => c.id === user.id);
      setStatus(mine?.status);
    });
  }, [user, params.id]);

  return (
    <Protected role="coach">
      <AppShell title="Athlete Profile">
        <div className="flex gap-2 mb-6 max-w-4xl">
          {(["sessions", "trends", "training"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-blue/12 text-blue border border-blue/30" : "text-t2 border border-border hover:bg-card"
              }`}
            >
              {t === "training" ? "Training Plan" : t}
            </button>
          ))}
        </div>

        {tab === "sessions" && <AthleteProfileView role="coach" athleteId={params.id} />}
        {tab === "trends" && (
          status === "accepted" ? (
            <div className="max-w-4xl">
              <AthleteTrends sessions={sessions} accentColor="#60a5fa" />
            </div>
          ) : (
            <EmptyState icon={<IconLock size={32} />} title="Connect with this athlete to view their performance trends" />
          )
        )}
        {tab === "training" && user && (
          status === "accepted" ? (
            <div className="max-w-2xl">
              <TrainingPanel coachId={user.id} athleteId={params.id} />
            </div>
          ) : (
            <EmptyState icon={<IconLock size={32} />} title="Connect with this athlete to assign training tasks" />
          )
        )}
      </AppShell>
    </Protected>
  );
}
