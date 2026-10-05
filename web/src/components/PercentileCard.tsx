"use client";

import { useEffect, useState } from "react";
import { api, AthletePercentile } from "@/lib/api";
import { Card } from "@/components/ui";
import { IconTrend } from "@/components/icons";

function barColor(pct: number) {
  if (pct >= 70) return "bg-green";
  if (pct >= 40) return "bg-orange";
  return "bg-red";
}

/**
 * Shows where this athlete ranks (percentile) against peers of the same
 * sport + IPC classification, per metric — see pipeline api.py
 * GET /athletes/{id}/percentiles. More concrete for a scout comparing
 * prospects than the single hand-set "elite reference" the 0-100 score is
 * normalized against. Silently renders nothing if there's too little peer
 * data yet (fewer than 3 peers of the same sport+class with sessions).
 */
export default function PercentileCard({ athleteId }: { athleteId: string }) {
  const [percentiles, setPercentiles] = useState<AthletePercentile[] | null>(null);

  useEffect(() => {
    api.get<{ percentiles: AthletePercentile[] }>(`/athletes/${athleteId}/percentiles`)
      .then((d) => setPercentiles(d.percentiles))
      .catch(() => setPercentiles([]));
  }, [athleteId]);

  if (!percentiles || percentiles.length === 0) return null;

  const peerCount = percentiles[0].peer_count;

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <IconTrend size={16} className="text-cyan" />
        <h3 className="text-sm font-bold">Percentile vs Peers</h3>
      </div>
      <p className="text-[11px] text-t3 mb-4">Ranked against {peerCount} athletes of the same sport &amp; classification</p>
      <div className="space-y-3">
        {percentiles.slice(0, 6).map((p) => (
          <div key={p.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-t2">{p.label}</span>
              <span className="font-semibold text-t1">{p.percentile}th percentile</span>
            </div>
            <div className="h-1.5 rounded-full bg-card2 overflow-hidden">
              <div className={`h-full rounded-full ${barColor(p.percentile)}`} style={{ width: `${p.percentile}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
