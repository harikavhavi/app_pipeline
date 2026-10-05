"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, discoverAthletes, Athlete } from "@/lib/api";
import { SPORTS, IPC_CLASSES } from "@/lib/constants";
import { Card, ScoreRing, Input, Select, Button, Spinner, EmptyState, Badge } from "@/components/ui";
import WatchlistButton from "@/components/WatchlistButton";
import { IconSearch, IconBarChart, IconCheck } from "@/components/icons";

const MIN_SCORE_OPTIONS = [
  { label: "Any score", value: "" },
  { label: "50+", value: "50" },
  { label: "70+", value: "70" },
  { label: "85+", value: "85" },
];

export default function ScoutDiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [ipcClass, setIpcClass] = useState("");
  const [state, setState] = useState("");
  const [minScore, setMinScore] = useState("");

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    discoverAthletes({}).then((d) => setAthletes(d.athletes)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: Athlete[] }>(`/scouts/${user.id}/watchlist`)
      .then((d) => setWatchlistIds(new Set(d.athletes.map((a) => a.id))));
  }, [user]);

  const states = useMemo(
    () => Array.from(new Set(athletes.map((a) => a.state).filter((s): s is string => !!s))).sort(),
    [athletes]
  );

  const filtered = useMemo(() => {
    const minScoreNum = minScore ? Number(minScore) : null;
    return athletes.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (sport && a.sport !== sport) return false;
      if (ipcClass && a.ipc_class !== ipcClass) return false;
      if (state && a.state !== state) return false;
      if (minScoreNum != null && (a.latest_score == null || a.latest_score < minScoreNum)) return false;
      return true;
    });
  }, [athletes, q, sport, ipcClass, state, minScore]);

  const MAX_SELECT = 5;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  }

  function compareSelected() {
    if (selected.length === 2) {
      router.push(`/scout/compare?a=${selected[0]}&b=${selected[1]}`);
    } else if (selected.length >= 3) {
      router.push(`/scout/compare/multi?ids=${selected.join(",")}`);
    }
  }

  return (
    <Protected role="scout">
      <AppShell title="Discover Athletes">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Input
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={sport} onChange={(e) => setSport(e.target.value)} className="w-56">
            <option value="">All sports</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
          <Select value={ipcClass} onChange={(e) => setIpcClass(e.target.value)} className="w-32">
            <option value="">All classes</option>
            {IPC_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select value={state} onChange={(e) => setState(e.target.value)} className="w-44">
            <option value="">All locations</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={minScore} onChange={(e) => setMinScore(e.target.value)} className="w-32">
            {MIN_SCORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-purple/8 border border-purple/25">
            <span className="text-sm text-t2">
              {selected.length} selected (up to {MAX_SELECT}) — {selected.length === 1 ? "pick at least 1 more to compare" : "2 for a detailed compare, 3+ for a radar comparison"}
            </span>
            <Button variant="secondary" accent="purple" className="ml-auto" disabled={selected.length < 2} onClick={compareSelected}>
              <IconBarChart size={15} /> Compare selected
            </Button>
          </div>
        )}

        {loading && <Spinner className="mx-auto my-16" />}
        {!loading && filtered.length === 0 && (
          <EmptyState icon={<IconSearch size={36} />} title="No athletes match these filters" sub="Try widening your search" />
        )}
        {!loading && (
          <p className="text-xs text-t3 mb-3">{filtered.length} athlete{filtered.length !== 1 ? "s" : ""} found</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {!loading &&
            filtered.map((a) => (
              <Card key={a.id} className="p-5 flex items-center gap-4 hover:border-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.includes(a.id)}
                  onChange={() => toggleSelect(a.id)}
                  className="w-4 h-4 accent-purple shrink-0"
                  aria-label={`Select ${a.name} for comparison`}
                />
                <Link href={`/scout/athlete/${a.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      {a.name}
                      {a.ipc_verified && <IconCheck size={13} className="text-green shrink-0" />}
                    </div>
                    <div className="text-xs text-t3 capitalize truncate mt-0.5">
                      {a.sport?.replace(/_/g, " ")} · {a.ipc_class}
                    </div>
                    {a.state && (
                      <div className="mt-1.5">
                        <Badge>{a.state}</Badge>
                      </div>
                    )}
                  </div>
                  {a.latest_score != null && <ScoreRing score={a.latest_score} size={44} />}
                </Link>
                {user && (
                  <WatchlistButton scoutId={user.id} athleteId={a.id} initialWatchlisted={watchlistIds.has(a.id)} />
                )}
              </Card>
            ))}
        </div>
      </AppShell>
    </Protected>
  );
}
