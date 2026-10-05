"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import MessagesView from "@/components/MessagesView";

export default function ScoutMessagesPage() {
  return (
    <Protected role="scout">
      <AppShell title="Messages">
        <MessagesView role="scout" />
      </AppShell>
    </Protected>
  );
}
