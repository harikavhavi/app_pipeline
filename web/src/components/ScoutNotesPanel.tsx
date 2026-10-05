"use client";

import { useEffect, useState } from "react";
import { api, ScoutNote } from "@/lib/api";
import { Card, Button, Spinner } from "@/components/ui";

/** Private per-scout evaluation notes on an athlete — never visible to the
 * athlete or other scouts. See pipeline database.py ScoutNote / api.py
 * /scouts/{id}/athletes/{id}/notes. */
export default function ScoutNotesPanel({ scoutId, athleteId }: { scoutId: string; athleteId: string }) {
  const [notes, setNotes] = useState<ScoutNote[] | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get<{ notes: ScoutNote[] }>(`/scouts/${scoutId}/athletes/${athleteId}/notes`).then((d) => setNotes(d.notes));
  }

  useEffect(load, [scoutId, athleteId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/scouts/${scoutId}/athletes/${athleteId}/notes`, { text: draft.trim() });
      setDraft("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setNotes((prev) => prev?.filter((n) => n.id !== id) ?? null);
    await api.delete(`/scouts/${scoutId}/notes/${id}`);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Your Private Notes</h3>
        <span className="text-[11px] text-t3">Only visible to you</span>
      </div>

      <form onSubmit={submit} className="flex gap-2 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a scouting note…"
          rows={2}
          className="flex-1 bg-bg-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-purple/40 resize-none"
        />
        <Button type="submit" accent="purple" disabled={submitting || !draft.trim()}>Add</Button>
      </form>

      {notes === null && <Spinner className="mx-auto my-6" />}
      {notes !== null && notes.length === 0 && <p className="text-xs text-t3">No notes yet.</p>}
      <div className="space-y-2">
        {notes?.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-3 bg-card2 border border-border rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm text-t2">{n.text}</p>
              <p className="text-[11px] text-t3 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => remove(n.id)} className="text-t3 hover:text-red text-xs shrink-0">Remove</button>
          </div>
        ))}
      </div>
    </Card>
  );
}
