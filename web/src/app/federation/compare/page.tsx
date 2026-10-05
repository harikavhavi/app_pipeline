"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api, Athlete } from "@/lib/api";
import CompareView from "@/components/CompareView";

export default function FederationComparePage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ athletes: Athlete[] }>("/athletes")
      .then((d) => setAthletes(d.athletes))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Protected role="federation">
      <AppShell title="Compare Athletes">
        <CompareView athletes={athletes} loadingAthletes={loading} />
      </AppShell>
    </Protected>
  );
}
