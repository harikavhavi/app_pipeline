"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import SessionDetail from "@/components/SessionDetail";

export default function CoachSessionPage({ params }: { params: { id: string } }) {
  return (
    <Protected role="coach">
      <AppShell title="Session">
        <SessionDetail sessionId={params.id} accentClass="text-blue" />
      </AppShell>
    </Protected>
  );
}
