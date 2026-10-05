"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, TrainingAssignment, TrainingStatus } from "@/lib/api";
import { Card, Badge, Select, Spinner, EmptyState } from "@/components/ui";
import { IconClock } from "@/components/icons";

const STATUS_TONE: Record<TrainingStatus, "neutral" | "blue" | "green"> = {
  assigned: "neutral",
  in_progress: "blue",
  completed: "green",
};

interface AthleteName { id: string; name: string }

export default function CoachTrainingOverviewPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TrainingAssignment[] | null>(null);
  const [athletes, setAthletes] = useState<AthleteName[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<{ assignments: TrainingAssignment[] }>(`/coaches/${user.id}/training`).then((d) => d.assignments),
      api.get<{ athletes: AthleteName[] }>(`/coaches/${user.id}/athletes`).then((d) => d.athletes),
    ]).then(([a, ath]) => {
      setAssignments(a);
      setAthletes(ath);
    });
  }, [user]);

  const athleteName = useMemo(() => {
    const m = new Map(athletes.map((a) => [a.id, a.name]));
    return (id: string) => m.get(id) ?? "Unknown athlete";
  }, [athletes]);

  const filtered = (assignments ?? []).filter((a) => !statusFilter || a.status === statusFilter);

  return (
    <Protected role="coach">
      <AppShell title="Training Plans">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-t3">Every training task you've assigned, across all your athletes</p>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        {assignments === null && <Spinner className="mx-auto my-12" />}
        {assignments !== null && filtered.length === 0 && (
          <EmptyState
            icon={<IconClock size={36} />}
            title="No training tasks yet"
            sub="Open an athlete's profile to assign one"
          />
        )}

        <div className="space-y-3">
          {filtered.map((a) => (
            <Link key={a.id} href={`/coach/athlete/${a.athlete_id}`}>
              <Card className="p-4 hover:border-blue/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-blue font-semibold mb-1">{athleteName(a.athlete_id)}</div>
                    <div className="font-semibold text-sm">{a.title}</div>
                    {a.description && <p className="text-xs text-t3 mt-1">{a.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {a.target_pillar && <Badge>{a.target_pillar}</Badge>}
                      {a.due_date && <span className="text-[11px] text-t3">Due {a.due_date}</span>}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[a.status]}>{a.status.replace("_", " ")}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </AppShell>
    </Protected>
  );
}
