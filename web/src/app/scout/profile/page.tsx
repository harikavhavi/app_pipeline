"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Card, Badge } from "@/components/ui";

export default function ScoutProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Protected role="scout">
      <AppShell title="Profile">
        <div className="max-w-lg">
          <Card className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple/15 border-2 border-purple flex items-center justify-center text-xl font-extrabold text-purple">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="text-lg font-bold">{user.name}</div>
              <div className="text-sm text-t3">{user.email}</div>
              <div className="mt-2"><Badge tone="purple">Scout</Badge></div>
            </div>
          </Card>
        </div>
      </AppShell>
    </Protected>
  );
}
