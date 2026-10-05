"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconStar } from "@/components/icons";

export default function WatchlistButton({
  scoutId, athleteId, initialWatchlisted = false, onChange,
}: {
  scoutId: string; athleteId: string; initialWatchlisted?: boolean; onChange?: (watchlisted: boolean) => void;
}) {
  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  const [busy, setBusy] = useState(false);

  // Discovery/Shortlist fetch the scout's watchlist asynchronously, after
  // these buttons have already mounted with initialWatchlisted defaulted to
  // false — without this, a later-arriving `true` would never be reflected
  // since useState only reads its initial value once, on mount.
  useEffect(() => setWatchlisted(initialWatchlisted), [initialWatchlisted]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !watchlisted;
    setWatchlisted(next); // optimistic
    try {
      if (next) await api.post(`/scouts/${scoutId}/watchlist/${athleteId}`);
      else await api.delete(`/scouts/${scoutId}/watchlist/${athleteId}`);
      onChange?.(next);
    } catch {
      setWatchlisted(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={watchlisted ? "Remove from shortlist" : "Add to shortlist"}
      title={watchlisted ? "Remove from shortlist" : "Add to shortlist"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
        watchlisted
          ? "bg-orange/15 border-orange/40 text-orange"
          : "border-border text-t3 hover:text-orange hover:border-orange/40"
      }`}
    >
      <IconStar size={15} />
    </button>
  );
}
