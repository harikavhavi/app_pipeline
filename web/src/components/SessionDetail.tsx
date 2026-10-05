"use client";

import { useEffect, useState } from "react";
import { api, API_BASE, SessionSummary, avgScore } from "@/lib/api";
import { Card, Button, MetricsByPillar, Spinner, ScoreRing } from "@/components/ui";
import { IconVideoOff } from "@/components/icons";
import AiFeedbackCard from "@/components/AiFeedbackCard";
import PercentileCard from "@/components/PercentileCard";

export default function SessionDetail({ sessionId, accentClass = "text-cyan" }: { sessionId: string; accentClass?: string }) {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    api.get<SessionSummary>(`/session/${sessionId}`)
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <Spinner className="mx-auto my-16" />;
  if (!session) return <p className="text-t3 text-sm">Session not found.</p>;

  const cards = session.metric_cards ?? [];
  const score = avgScore(cards);
  const hasVideo = session.video_metadata?.has_video && !videoError;

  return (
    <div className="max-w-4xl">
      <p className="print-only text-lg font-extrabold mb-1">ParaSync Scouting Report</p>

      {hasVideo ? (
        <div className="no-print w-full aspect-video bg-black rounded-xl2 overflow-hidden mb-6 border border-border">
          <video
            src={`${API_BASE}/session/${sessionId}/video`}
            controls
            className="w-full h-full"
            onError={() => setVideoError(true)}
          />
        </div>
      ) : (
        <Card className="no-print p-12 flex flex-col items-center gap-3 mb-6">
          <IconVideoOff size={28} className="text-t3" />
          <p className="text-t3 text-sm">Video not available for this session</p>
        </Card>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold capitalize">{session.sport?.replace(/_/g, " ")}</h2>
          <p className="text-t3 text-sm mt-1">
            {session.date} · {session.ipc_class}
            {session.video_metadata?.filename ? ` · ${session.video_metadata.filename}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={score} size={56} />
          <Button variant="ghost" className="no-print" onClick={() => window.print()}>Export PDF</Button>
        </div>
      </div>

      <AiFeedbackCard feedback={session.feedback} />
      <PercentileCard athleteId={session.athlete_id} />

      <MetricsByPillar cards={cards} accentClass={accentClass} />
    </div>
  );
}
