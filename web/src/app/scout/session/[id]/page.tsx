"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import SessionDetail from "@/components/SessionDetail";

export default function ScoutSessionPage({ params }: { params: { id: string } }) {
  return (
    <Protected role="scout">
      <AppShell title="Session">
        <SessionDetail sessionId={params.id} accentClass="text-purple" />
      </AppShell>
    </Protected>
  );
}
