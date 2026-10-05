"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Athlete, SessionSummary, latestPillarAverages, avgScore } from "@/lib/api";
import { Card, Spinner, EmptyState, ScoreRing } from "@/components/ui";
import RadarCompareChart from "@/components/charts/RadarCompareChart";
import { IconBarChart } from "@/components/icons";

const PALETTE = ["#22d3ee", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"]; // cyan, orange, purple, blue, green
const MAX_ATHLETES = 5;
const MIN_ATHLETES = 3;

export default function MultiCompareView({
  athletes, loadingAthletes, initialIds = [],
}: {
  athletes: Athlete[]; loadingAthletes: boolean; initialIds?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialIds.slice(0, MAX_ATHLETES));
  const [sessionsById, setSessionsById] = useState<Record<string, SessionSummary[]>>({});

  useEffect(() => {
    if (!selected.length || !athletes.length) return;
    if (!initialIds.length) return;
    const valid = initialIds.filter((id) => athletes.some((a) => a.id === id));
    if (valid.length) setSelected(valid.slice(0, MAX_ATHLETES));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athletes]);

  useEffect(() => {
    selected.forEach((id) => {
      if (sessionsById[id]) return;
      api.get<{ sessions: SessionSummary[] }>(`/sessions/${id}`).then((d) => {
        setSessionsById((prev) => ({ ...prev, [id]: d.sessions }));
      });
    });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ATHLETES) return prev;
      return [...prev, id];
    });
  }

  const selectedAthletes = selected.map((id) => athletes.find((a) => a.id === id)).filter((a): a is Athlete => !!a);
  const ready = selected.every((id) => sessionsById[id] !== undefined);

  const radarData = useMemo(() => {
    if (!ready) return [];
    const pillarSets = selected.map((id) => latestPillarAverages(sessionsById[id] ?? []));
    const pillars = Array.from(new Set(pillarSets.flatMap((m) => Array.from(m.keys())))).sort();
    return pillars.map((pillar) => {
      const row: Record<string, any> = { label: pillar };
      selected.forEach((id, i) => { row[id] = pillarSets[i].get(pillar) ?? 0; });
      return row;
    });
  }, [ready, selected, sessionsById]);

  if (loadingAthletes) return <Spinner className="mx-auto my-16" />;
  if (athletes.length < MIN_ATHLETES) {
    return (
      <EmptyState
        icon={<IconBarChart size={36} />}
        title={`Need at least ${MIN_ATHLETES} athletes to multi-compare`}
        sub="Connect with more athletes, or check back once more have joined."
      />
    );
  }

  return (
    <div>
      <p className="text-sm text-t3 mb-4">
        Select {MIN_ATHLETES}–{MAX_ATHLETES} athletes to compare on a radar chart, one axis per pillar (average of latest-session metric scores).
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {athletes.map((a) => {
          const idx = selected.indexOf(a.id);
          const color = idx >= 0 ? PALETTE[idx] : undefined;
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              disabled={idx === -1 && selected.length >= MAX_ATHLETES}
              className="text-left"
            >
              <Card
                className="p-3 flex items-center gap-3 transition-colors disabled:opacity-40"
                style={idx >= 0 ? { borderColor: color, background: `${color}12` } : undefined}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-border"
                  style={{ background: color ?? "transparent" }}
                />
                <span className="text-sm font-medium truncate">{a.name}</span>
              </Card>
            </button>
          );
        })}
      </div>

      {selected.length < MIN_ATHLETES ? (
        <p className="text-xs text-t3">Pick at least {MIN_ATHLETES - selected.length} more athlete(s) to see the chart.</p>
      ) : !ready ? (
        <Spinner className="mx-auto my-12" />
      ) : (
        <>
          <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
            {selectedAthletes.map((a, i) => (
              <Card key={a.id} className="p-4 flex items-center gap-3" style={{ borderColor: PALETTE[i] + "40" }}>
                <ScoreRing score={avgScore(([...sessionsById[a.id]].sort((x, y) => y.date.localeCompare(x.date))[0])?.metric_cards)} size={36} />
                <span className="text-xs font-semibold truncate">{a.name}</span>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <RadarCompareChart
              data={radarData}
              series={selected.map((id, i) => ({
                key: id,
                color: PALETTE[i],
                name: athletes.find((a) => a.id === id)?.name ?? id,
              }))}
            />
          </Card>
        </>
      )}
    </div>
  );
}
