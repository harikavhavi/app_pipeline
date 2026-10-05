"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, Button, Spinner, EmptyState } from "@/components/ui";
import { IconInbox, IconUser } from "@/components/icons";

interface Req { id: string; name: string; sport: string; ipc_class: string; requested_at?: string }

export default function CoachRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  function load() {
    if (!user) return;
    api.get<{ requests: Req[] }>(`/coaches/${user.id}/requests`).then((d) => {
      setRequests(d.requests);
      setLoading(false);
    });
  }

  useEffect(load, [user]);

  async function respond(athleteId: string, status: "accepted" | "declined") {
    if (!user) return;
    setBusy((b) => new Set(b).add(athleteId));
    await api.patch(`/athletes/${athleteId}/coaches/${user.id}`, { status });
    setRequests((r) => r.filter((x) => x.id !== athleteId));
    setBusy((b) => {
      const n = new Set(b);
      n.delete(athleteId);
      return n;
    });
  }

  return (
    <Protected role="coach">
      <AppShell title="Connection Requests">
        {loading && <Spinner className="mx-auto my-12" />}
        {!loading && requests.length === 0 && (
          <EmptyState icon={<IconInbox size={36} />} title="No pending requests" sub="New connection requests from athletes will show up here" />
        )}
        {!loading &&
          requests.map((r) => (
            <Card key={r.id} className="p-5 flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue/15 border border-blue/40 flex items-center justify-center shrink-0">
                  <IconUser size={16} className="text-blue" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-xs text-t3 capitalize truncate">{r.sport?.replace(/_/g, " ")} · {r.ipc_class}</div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" accent="green" disabled={busy.has(r.id)} onClick={() => respond(r.id, "accepted")}>Accept</Button>
                <Button variant="ghost" disabled={busy.has(r.id)} onClick={() => respond(r.id, "declined")}>Decline</Button>
              </div>
            </Card>
          ))}
      </AppShell>
    </Protected>
  );
}
