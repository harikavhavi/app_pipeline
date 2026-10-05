"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Athlete, SessionSummary, avgScore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, Badge, Button, SessionRow, Spinner, EmptyState } from "@/components/ui";
import { IconUser, IconLock, IconVideo } from "@/components/icons";

export default function AthleteProfileView({ role, athleteId }: { role: "scout" | "coach"; athleteId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const accent = role === "scout" ? "purple" : "blue";

  useEffect(() => {
    Promise.all([
      api.get<Athlete>(`/athletes/${athleteId}`).catch(() => null),
      api.get<{ sessions: SessionSummary[] }>(`/sessions/${athleteId}`).then((d) => d.sessions).catch(() => []),
    ]).then(([a, s]) => {
      setAthlete(a);
      setSessions(s);
      setLoading(false);
    });
    api.post(`/athletes/${athleteId}/view`).catch(() => {});
  }, [athleteId]);

  useEffect(() => {
    if (!user) return;
    const path = role === "scout" ? `/athletes/${athleteId}/scouts` : `/athletes/${athleteId}/coaches`;
    const key = role === "scout" ? "scouts" : "coaches";
    api.get<any>(path).then((d) => {
      const mine = (d[key] ?? []).find((c: any) => c.id === user.id);
      setStatus(mine?.status);
    });
  }, [user, role, athleteId]);

  async function respond(newStatus: "accepted" | "declined") {
    if (!user) return;
    const path = role === "scout" ? `/athletes/${athleteId}/scouts/${user.id}` : `/athletes/${athleteId}/coaches/${user.id}`;
    await api.patch(path, { status: newStatus });
    setStatus(newStatus);
  }

  if (loading) return <Spinner className="mx-auto my-16" />;
  if (!athlete) return <p className="text-t3 text-sm">Athlete not found.</p>;

  const accentText = accent === "purple" ? "text-purple" : "text-blue";
  const accentBorder = accent === "purple" ? "border-purple/40" : "border-blue/40";
  const accentBg = accent === "purple" ? "bg-purple/15" : "bg-blue/15";

  return (
    <div className="max-w-4xl">
      <Card className="p-6 flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-full ${accentBg} border-2 ${accentBorder} flex items-center justify-center text-xl font-extrabold ${accentText}`}>
          {athlete.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold">{athlete.name}</div>
          <div className="text-sm text-t3 capitalize">
            {athlete.sport?.replace(/_/g, " ")} · {athlete.ipc_class}
          </div>
        </div>
        {status === "accepted" ? (
          <Badge tone="green">Connected</Badge>
        ) : status === "pending" ? (
          <div className="flex gap-2">
            <Button variant="secondary" accent="green" onClick={() => respond("accepted")}>Accept</Button>
            <Button variant="ghost" onClick={() => respond("declined")}>Decline</Button>
          </div>
        ) : (
          <Badge>Not Connected</Badge>
        )}
      </Card>

      <h3 className="text-sm font-bold mb-3">{sessions.length > 0 ? `Sessions (${sessions.length})` : "No Sessions Yet"}</h3>

      {status === "accepted" ? (
        <>
          {sessions.length === 0 && <EmptyState icon={<IconVideo size={32} />} title="No sessions uploaded yet" />}
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              href={`/${role}/session/${s.id}`}
              sport={s.sport}
              date={s.date}
              duration={s.video_metadata?.duration_sec ? `${Math.round(s.video_metadata.duration_sec)}s` : undefined}
              score={avgScore(s.metric_cards)}
              subtitle={s.video_metadata?.filename}
            />
          ))}
        </>
      ) : (
        <EmptyState
          icon={<IconLock size={32} />}
          title="Connect with this athlete to view their session videos and metrics"
        />
      )}
    </div>
  );
}
