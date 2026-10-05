"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { discoverAthletes, Athlete } from "@/lib/api";
import CompareView from "@/components/CompareView";

export default function ScoutComparePage() {
  const searchParams = useSearchParams();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Every discoverable athlete, not just already-connected ones — a scout
    // should be able to compare prospects found via Discovery before
    // deciding whether to send a connection request.
    discoverAthletes({}).then((d) => setAthletes(d.athletes)).finally(() => setLoading(false));
  }, []);

  return (
    <Protected role="scout">
      <AppShell title="Compare Athletes">
        <Link href="/scout/compare/multi" className="inline-block text-xs text-purple font-semibold hover:underline mb-4">
          Comparing more than 2? Try the multi-athlete radar view →
        </Link>
        <CompareView
          athletes={athletes}
          loadingAthletes={loading}
          initialIdA={searchParams.get("a") ?? undefined}
          initialIdB={searchParams.get("b") ?? undefined}
        />
      </AppShell>
    </Protected>
  );
}
