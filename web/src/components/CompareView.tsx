"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Athlete, SessionSummary, avgScore, catalogMetrics, metricTrend, latestMetricScores } from "@/lib/api";
import { Card, ScoreRing, Select, Spinner, EmptyState } from "@/components/ui";
import CompareBarChart from "@/components/charts/CompareBarChart";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { IconBarChart } from "@/components/icons";

const COLOR_A = "#22d3ee"; // cyan
const COLOR_B = "#fbbf24"; // orange

export default function CompareView({
  athletes, loadingAthletes, initialIdA, initialIdB,
}: {
  athletes: Athlete[]; loadingAthletes: boolean; initialIdA?: string; initialIdB?: string;
}) {
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [sessionsA, setSessionsA] = useState<SessionSummary[] | null>(null);
  const [sessionsB, setSessionsB] = useState<SessionSummary[] | null>(null);
  const [metricKey, setMetricKey] = useState("");

  useEffect(() => {
    if (!athletes.length || (idA && idB)) return;
    // Preselected IDs (e.g. from the Discovery page's "Compare selected"
    // action) take priority; fall back to the first two athletes so the
    // page is never blank.
    const a = initialIdA && athletes.some((x) => x.id === initialIdA) ? initialIdA : athletes[0]?.id;
    const b = initialIdB && athletes.some((x) => x.id === initialIdB) ? initialIdB : athletes.find((x) => x.id !== a)?.id;
    if (a) setIdA(a);
    if (b) setIdB(b);
  }, [athletes, idA, idB, initialIdA, initialIdB]);

  useEffect(() => {
    if (!idA) return setSessionsA(null);
    api.get<{ sessions: SessionSummary[] }>(`/sessions/${idA}`).then((d) => setSessionsA(d.sessions));
  }, [idA]);

  useEffect(() => {
    if (!idB) return setSessionsB(null);
    api.get<{ sessions: SessionSummary[] }>(`/sessions/${idB}`).then((d) => setSessionsB(d.sessions));
  }, [idB]);

  const athleteA = athletes.find((a) => a.id === idA);
  const athleteB = athletes.find((a) => a.id === idB);

  const barData = useMemo(() => {
    if (!sessionsA || !sessionsB) return [];
    const scoresA = latestMetricScores(sessionsA);
    const scoresB = latestMetricScores(sessionsB);
    const metrics = catalogMetrics([...sessionsA, ...sessionsB]);
    return metrics
      .filter((m) => scoresA.has(m.id) || scoresB.has(m.id))
      .map((m) => ({ label: m.label, a: scoresA.get(m.id) ?? 0, b: scoresB.get(m.id) ?? 0 }));
  }, [sessionsA, sessionsB]);

  const allMetrics = useMemo(() => (sessionsA && sessionsB ? catalogMetrics([...sessionsA, ...sessionsB]) : []), [sessionsA, sessionsB]);

  useEffect(() => {
    if (allMetrics.length && !allMetrics.find((m) => m.id === metricKey)) setMetricKey(allMetrics[0].id);
  }, [allMetrics, metricKey]);

  const trendData = useMemo(() => {
    if (!sessionsA || !sessionsB || !metricKey) return [];
    const ta = metricTrend(sessionsA, metricKey);
    const tb = metricTrend(sessionsB, metricKey);
    const labels = Array.from(new Set([...ta.map((p) => p.label), ...tb.map((p) => p.label)])).sort();
    return labels.map((label) => ({
      label,
      a: ta.find((p) => p.label === label)?.value,
      b: tb.find((p) => p.label === label)?.value,
    }));
  }, [sessionsA, sessionsB, metricKey]);

  if (loadingAthletes) return <Spinner className="mx-auto my-16" />;
  if (athletes.length < 2) {
    return (
      <EmptyState
        icon={<IconBarChart size={36} />}
        title="Need at least 2 athletes to compare"
        sub="Connect with more athletes, or check back once more have joined."
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <AthletePicker label="Athlete A" color={COLOR_A} athletes={athletes} value={idA} onChange={setIdA} exclude={idB} />
        <AthletePicker label="Athlete B" color={COLOR_B} athletes={athletes} value={idB} onChange={setIdB} exclude={idA} />
      </div>

      {(!sessionsA || !sessionsB) ? (
        <Spinner className="mx-auto my-16" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <SummaryCard athlete={athleteA} sessions={sessionsA} color={COLOR_A} />
            <SummaryCard athlete={athleteB} sessions={sessionsB} color={COLOR_B} />
          </div>

          <h3 className="text-sm font-bold mb-3">Latest Session — Metric Comparison</h3>
          <Card className="p-5 mb-8">
            <CompareBarChart
              data={barData}
              series={[
                { key: "a", color: COLOR_A, name: athleteA?.name ?? "Athlete A" },
                { key: "b", color: COLOR_B, name: athleteB?.name ?? "Athlete B" },
              ]}
              height={280}
            />
          </Card>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Metric Trend Comparison</h3>
            <Select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className="w-64">
              {allMetrics.map((m) => (
                <option key={m.id} value={m.id}>{m.pillar} — {m.label}</option>
              ))}
            </Select>
          </div>
          <Card className="p-5">
            <TrendLineChart
              data={trendData}
              series={[
                { key: "a", color: COLOR_A, name: athleteA?.name ?? "Athlete A" },
                { key: "b", color: COLOR_B, name: athleteB?.name ?? "Athlete B" },
              ]}
              height={280}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function AthletePicker({
  label, color, athletes, value, onChange, exclude,
}: {
  label: string; color: string; athletes: Athlete[]; value: string; onChange: (v: string) => void; exclude: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold text-t3">{label}</span>
      </div>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {athletes.map((a) => (
          <option key={a.id} value={a.id} disabled={a.id === exclude}>
            {a.name} — {a.sport.replace(/_/g, " ")}
          </option>
        ))}
      </Select>
    </Card>
  );
}

function SummaryCard({ athlete, sessions, color }: { athlete?: Athlete; sessions: SessionSummary[]; color: string }) {
  const latest = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const score = latest ? avgScore(latest.metric_cards) : 0;
  return (
    <Card className="p-5 flex items-center gap-4" style={{ borderColor: color + "40" }}>
      <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-extrabold" style={{ borderColor: color, color, background: color + "18" }}>
        {(athlete?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
      </div>
      <div className="flex-1">
        <div className="font-bold">{athlete?.name}</div>
        <div className="text-xs text-t3">{sessions.length} sessions analysed</div>
      </div>
      <ScoreRing score={score} size={48} />
    </Card>
  );
}
