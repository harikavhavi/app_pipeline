"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api, Athlete } from "@/lib/api";
import { Card, StatCard, Spinner } from "@/components/ui";

export default function FederationDashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ athletes: Athlete[] }>("/athletes").then((d) => setAthletes(d.athletes)).finally(() => setLoading(false));
  }, []);

  const bySport = athletes.reduce<Record<string, number>>((acc, a) => {
    acc[a.sport] = (acc[a.sport] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Protected role="federation">
      <AppShell title="Federation Dashboard">
        {loading ? (
          <Spinner className="mx-auto my-12" />
        ) : (
          <>
            <div className="flex gap-4 mb-8">
              <StatCard label="Registered Athletes" value={athletes.length} accentClass="text-green" />
              <StatCard label="Sports Represented" value={Object.keys(bySport).length} accentClass="text-green" />
              <StatCard label="Discoverable Profiles" value={athletes.filter((a) => a.discoverable).length} accentClass="text-green" />
            </div>

            <h3 className="text-sm font-bold mb-3">Athletes by Sport</h3>
            <Card className="p-6">
              {Object.entries(bySport).map(([sport, count]) => (
                <div key={sport} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-sm capitalize w-48 shrink-0">{sport.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-green"
                      style={{ width: `${(count / Math.max(...Object.values(bySport))) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-t3 w-6 text-right">{count}</span>
                </div>
              ))}
            </Card>
          </>
        )}
      </AppShell>
    </Protected>
  );
}
