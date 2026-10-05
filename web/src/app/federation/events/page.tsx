"use client";

import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { Card, Button } from "@/components/ui";
import { IconCalendar } from "@/components/icons";

const EVENTS = [
  { id: "1", name: "National Selection Trials", date: "Sep 12, 2026", loc: "New Delhi", rsvps: 42, capacity: 60 },
  { id: "2", name: "State Championship Karnataka", date: "Oct 5, 2026", loc: "Bengaluru", rsvps: 28, capacity: 40 },
  { id: "3", name: "Asian Para Games Qualifier", date: "Nov 20, 2026", loc: "Hyderabad", rsvps: 18, capacity: 25 },
];

export default function FederationEventsPage() {
  return (
    <Protected role="federation">
      <AppShell title="Event Management">
        {EVENTS.map((e) => (
          <Card key={e.id} className="p-5 mb-4">
            <div className="font-bold mb-1.5">{e.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-t3 mb-4">
              <IconCalendar size={13} />
              {e.date} · {e.loc}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] text-t3 w-10">RSVPs</span>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-orange" style={{ width: `${(e.rsvps / e.capacity) * 100}%` }} />
              </div>
              <span className="text-[11px] text-orange font-bold">{e.rsvps}/{e.capacity}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" accent="green" className="flex-1">Manage</Button>
              <Button variant="ghost" className="flex-1 border border-border">Publish Results</Button>
            </div>
          </Card>
        ))}
      </AppShell>
    </Protected>
  );
}
