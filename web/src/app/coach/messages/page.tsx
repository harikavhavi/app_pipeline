"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import MessagesView from "@/components/MessagesView";

export default function CoachMessagesPage() {
  return (
    <Protected role="coach">
      <AppShell title="Messages">
        <MessagesView role="coach" />
      </AppShell>
    </Protected>
  );
}
