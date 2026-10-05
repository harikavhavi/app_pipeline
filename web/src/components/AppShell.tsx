"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/api";
import {
  IconHome, IconUser, IconMessage, IconLogout, IconCalendar, IconUsers, IconBarChart, IconInbox, IconSearch, IconClock, IconStar,
} from "./icons";
import ScoutChatWidget from "./ScoutChatWidget";
import NotificationBell from "./NotificationBell";

type NavItem = { label: string; href: string; icon: (p: { size?: number; className?: string }) => JSX.Element };

const NAV: Partial<Record<Role, NavItem[]>> = {
  scout: [
    { label: "Home", href: "/scout", icon: IconHome },
    { label: "Discover", href: "/scout/discover", icon: IconSearch },
    { label: "Shortlist", href: "/scout/shortlist", icon: IconStar },
    { label: "My Athletes", href: "/scout/athletes", icon: IconUsers },
    { label: "Compare", href: "/scout/compare", icon: IconBarChart },
    { label: "Requests", href: "/scout/requests", icon: IconInbox },
    { label: "Messages", href: "/scout/messages", icon: IconMessage },
    { label: "Profile", href: "/scout/profile", icon: IconUser },
  ],
  federation: [
    { label: "Dashboard", href: "/federation", icon: IconHome },
    { label: "Athletes", href: "/federation/athletes", icon: IconUsers },
    { label: "Compare", href: "/federation/compare", icon: IconBarChart },
    { label: "Events", href: "/federation/events", icon: IconCalendar },
  ],
  coach: [
    { label: "Home", href: "/coach", icon: IconHome },
    { label: "My Athletes", href: "/coach/athletes", icon: IconUsers },
    { label: "Training Plans", href: "/coach/training", icon: IconClock },
    { label: "Requests", href: "/coach/requests", icon: IconInbox },
    { label: "Messages", href: "/coach/messages", icon: IconMessage },
    { label: "Profile", href: "/coach/profile", icon: IconUser },
  ],
};

// Tailwind's JIT scans for literal class strings, so dynamically built
// `bg-${accent}/15`-style names never get generated — every combination
// used per role is spelled out here instead.
const ACCENT: Partial<Record<Role, { badgeBg: string; badgeBorder: string; text: string; navActive: string }>> = {
  scout: {
    badgeBg: "bg-purple/15", badgeBorder: "border-purple/40", text: "text-purple",
    navActive: "bg-purple/12 text-purple border border-purple/30",
  },
  federation: {
    badgeBg: "bg-green/15", badgeBorder: "border-green/40", text: "text-green",
    navActive: "bg-green/12 text-green border border-green/30",
  },
  coach: {
    badgeBg: "bg-blue/15", badgeBorder: "border-blue/40", text: "text-blue",
    navActive: "bg-blue/12 text-blue border border-blue/30",
  },
};

export default function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;

  const items = NAV[user.role] ?? [];
  const accent = ACCENT[user.role] ?? ACCENT.scout!;

  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-64 shrink-0 border-r border-border bg-bg-1 flex flex-col fade-in">
        <div className="px-6 py-6 flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${accent.badgeBg} border ${accent.badgeBorder} flex items-center justify-center`}>
            <span className={`${accent.text} font-black text-sm`}>P</span>
          </div>
          <span className="font-extrabold tracking-tight text-lg">ParaSync</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? accent.navActive : "text-t2 border border-transparent hover:bg-card hover:text-t1"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-border mx-3">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-9 h-9 rounded-full bg-card2 border border-border flex items-center justify-center text-xs font-bold">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-t3 capitalize">{user.role}</div>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="text-t3 hover:text-red transition-colors"
              title="Log out"
            >
              <IconLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="no-print h-16 border-b border-border flex items-center justify-between px-8 sticky top-0 bg-bg/80 backdrop-blur-md z-10">
          <h1 className="text-lg font-bold">{title}</h1>
          {(user.role === "scout" || user.role === "coach") && (
            <NotificationBell userId={user.id} role={user.role} />
          )}
        </header>
        <div className="p-8 max-w-6xl fade-in">{children}</div>
      </main>

      {user.role === "scout" && (
        <div className="no-print">
          <ScoutChatWidget scoutId={user.id} />
        </div>
      )}
    </div>
  );
}
