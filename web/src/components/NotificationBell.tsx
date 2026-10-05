"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AppNotification } from "@/lib/api";
import { IconBell } from "@/components/icons";

const POLL_MS = 20_000;

/**
 * In-app notification bell — no email/push infra exists, so this is polled
 * rather than pushed. Currently the only event type is "new_session" (see
 * pipeline database.py notify_new_session), fired when an athlete a
 * scout/coach is connected to uploads a new session.
 */
export default function NotificationBell({ userId, role }: { userId: string; role: "scout" | "coach" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  function load() {
    api.get<{ notifications: AppNotification[]; unread_count: number }>(`/users/${userId}/notifications`)
      .then((d) => {
        setNotifications(d.notifications);
        setUnreadCount(d.unread_count);
      });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await api.post(`/users/${userId}/notifications/read-all`);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function openNotification(n: AppNotification) {
    if (!n.read) {
      await api.patch(`/notifications/${n.id}?user_id=${userId}`);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.session_id) router.push(`/${role}/session/${n.session_id}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-t3 hover:text-t1 hover:bg-card2 transition-colors"
        aria-label="Notifications"
      >
        <IconBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl2 shadow-2xl z-50 fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-cyan font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-xs text-t3 px-4 py-6 text-center">No notifications yet</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-card2 transition-colors ${
                  n.read ? "" : "bg-cyan/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-t2">{n.message}</p>
                    <p className="text-[11px] text-t3 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
