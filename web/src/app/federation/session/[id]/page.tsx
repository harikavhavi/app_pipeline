"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import SessionDetail from "@/components/SessionDetail";

export default function FederationSessionPage({ params }: { params: { id: string } }) {
  return (
    <Protected role="federation">
      <AppShell title="Session">
        <SessionDetail sessionId={params.id} accentClass="text-green" />
      </AppShell>
    </Protected>
  );
}
