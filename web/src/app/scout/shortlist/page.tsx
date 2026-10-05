"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, Athlete } from "@/lib/api";
import { Card, ScoreRing, Spinner, EmptyState, Badge } from "@/components/ui";
import WatchlistButton from "@/components/WatchlistButton";
import { IconStar, IconCheck } from "@/components/icons";

export default function ScoutShortlistPage() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: Athlete[] }>(`/scouts/${user.id}/watchlist`).then((d) => setAthletes(d.athletes));
  }, [user]);

  return (
    <Protected role="scout">
      <AppShell title="Shortlist">
        <p className="text-sm text-t3 mb-6">Athletes you're keeping an eye on — no connection request needed</p>

        {athletes === null && <Spinner className="mx-auto my-16" />}
        {athletes !== null && athletes.length === 0 && (
          <EmptyState
            icon={<IconStar size={36} />}
            title="Your shortlist is empty"
            sub="Star an athlete from Discover to add them here"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          {athletes?.map((a) => (
            <Card key={a.id} className="p-5 flex items-center gap-4 hover:border-purple/40 transition-colors">
              <Link href={`/scout/athlete/${a.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1.5">
                    {a.name}
                    {a.ipc_verified && <IconCheck size={13} className="text-green shrink-0" />}
                  </div>
                  <div className="text-xs text-t3 capitalize truncate mt-0.5">
                    {a.sport?.replace(/_/g, " ")} · {a.ipc_class}
                  </div>
                  {a.state && <div className="mt-1.5"><Badge>{a.state}</Badge></div>}
                </div>
                {a.latest_score != null && <ScoreRing score={a.latest_score} size={44} />}
              </Link>
              {user && (
                <WatchlistButton
                  scoutId={user.id}
                  athleteId={a.id}
                  initialWatchlisted
                  onChange={(w) => { if (!w) setAthletes((prev) => prev?.filter((x) => x.id !== a.id) ?? null); }}
                />
              )}
            </Card>
          ))}
        </div>
      </AppShell>
    </Protected>
  );
}
