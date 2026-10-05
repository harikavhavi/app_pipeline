"use client";

import { useEffect, useState } from "react";
import { api, TrainingAssignment, TrainingStatus } from "@/lib/api";
import { Card, Badge, Button, Input, Select, Spinner, EmptyState } from "@/components/ui";
import { IconClock } from "@/components/icons";

const PILLARS = ["Motion & Kinematics", "Body Pose & Form", "Timing & Responsiveness", "Fatigue & Risk"];

const STATUS_TONE: Record<TrainingStatus, "neutral" | "blue" | "green"> = {
  assigned: "neutral",
  in_progress: "blue",
  completed: "green",
};

/**
 * Per-athlete training assignment list + create form, embedded in the
 * coach's athlete detail page. Read-only list rendering is reused by the
 * Training Plans overview page across all of a coach's athletes.
 */
export default function TrainingPanel({
  coachId, athleteId, canCreate = true,
}: {
  coachId: string; athleteId: string; canCreate?: boolean;
}) {
  const [assignments, setAssignments] = useState<TrainingAssignment[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pillar, setPillar] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get<{ assignments: TrainingAssignment[] }>(`/athletes/${athleteId}/training`)
      .then((d) => setAssignments(d.assignments.filter((a) => a.coach_id === coachId)));
  }

  useEffect(load, [athleteId, coachId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/coaches/${coachId}/athletes/${athleteId}/training`, {
        title: title.trim(),
        description: description.trim() || undefined,
        target_pillar: pillar || undefined,
        due_date: dueDate || undefined,
      });
      setTitle(""); setDescription(""); setPillar(""); setDueDate(""); setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: TrainingStatus) {
    setAssignments((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? null);
    await api.patch(`/training/${id}`, { status });
  }

  async function remove(id: string) {
    setAssignments((prev) => prev?.filter((a) => a.id !== id) ?? null);
    await api.delete(`/training/${id}`);
  }

  if (assignments === null) return <Spinner className="mx-auto my-12" />;

  return (
    <div>
      {canCreate && (
        <div className="mb-5">
          {!showForm ? (
            <Button variant="secondary" accent="blue" onClick={() => setShowForm(true)}>
              + Assign training task
            </Button>
          ) : (
            <Card className="p-5">
              <form onSubmit={submit} className="space-y-3">
                <Input placeholder="Title (e.g. Improve push symmetry)" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex gap-3">
                  <Select value={pillar} onChange={(e) => setPillar(e.target.value)} className="flex-1">
                    <option value="">No specific pillar</option>
                    {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="flex-1" />
                </div>
                {error && <p className="text-red text-xs">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" accent="blue" disabled={submitting}>{submitting ? "Assigning…" : "Assign"}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {assignments.length === 0 ? (
        <EmptyState icon={<IconClock size={32} />} title="No training tasks assigned yet" />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{a.title}</div>
                  {a.description && <p className="text-xs text-t3 mt-1">{a.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {a.target_pillar && <Badge>{a.target_pillar}</Badge>}
                    {a.due_date && <span className="text-[11px] text-t3">Due {a.due_date}</span>}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{a.status.replace("_", " ")}</Badge>
              </div>
              {canCreate && (
                <div className="flex gap-2 mt-2">
                  {a.status !== "completed" && (
                    <button
                      className="text-xs text-blue font-semibold hover:underline"
                      onClick={() => updateStatus(a.id, a.status === "assigned" ? "in_progress" : "completed")}
                    >
                      Mark {a.status === "assigned" ? "in progress" : "completed"}
                    </button>
                  )}
                  <button className="text-xs text-t3 hover:text-red" onClick={() => remove(a.id)}>Remove</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
