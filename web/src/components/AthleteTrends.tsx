"use client";

import { useMemo, useState } from "react";
import { SessionSummary, catalogMetrics, metricTrend, scoreTrend } from "@/lib/api";
import { Card } from "@/components/ui";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { IconTrend } from "@/components/icons";

export default function AthleteTrends({ sessions, accentColor = "#a78bfa" }: { sessions: SessionSummary[]; accentColor?: string }) {
  const pillars = useMemo(() => {
    const metrics = catalogMetrics(sessions);
    const map = new Map<string, typeof metrics>();
    for (const m of metrics) {
      if (!map.has(m.pillar)) map.set(m.pillar, []);
      map.get(m.pillar)!.push(m);
    }
    return Array.from(map.entries());
  }, [sessions]);

  const [pillar, setPillar] = useState<string | null>(pillars[0]?.[0] ?? null);

  if (sessions.length < 2) {
    return (
      <Card className="p-10 flex flex-col items-center text-center">
        <IconTrend size={30} className="text-t3 mb-3" />
        <p className="font-semibold text-t1 mb-1">Not enough sessions for a trend yet</p>
        <p className="text-sm text-t3">Trends need at least 2 analysed sessions — this athlete has {sessions.length}.</p>
      </Card>
    );
  }

  const overall = scoreTrend(sessions).map((p) => ({ label: p.label, score: p.value }));
  const activeMetrics = pillars.find(([p]) => p === pillar)?.[1] ?? [];

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3">Overall Score Trend</h3>
        <Card className="p-5">
          <TrendLineChart data={overall} series={[{ key: "score", color: accentColor, name: "Overall Score" }]} />
        </Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Metric Trends</h3>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {pillars.map(([p]) => (
            <button
              key={p}
              onClick={() => setPillar(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pillar === p ? "bg-card2 text-t1 border border-t3/40" : "text-t3 hover:text-t1"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {activeMetrics.map((m) => {
          const trend = metricTrend(sessions, m.id).map((p) => ({ label: p.label, value: p.value }));
          return (
            <Card key={m.id} className="p-4">
              <div className="text-xs font-semibold text-t1 mb-1">{m.label}</div>
              <TrendLineChart data={trend} series={[{ key: "value", color: accentColor, name: m.label }]} height={140} unit={m.unit ?? ""} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
