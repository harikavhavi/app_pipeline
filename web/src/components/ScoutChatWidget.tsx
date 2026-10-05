"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { api, Athlete } from "@/lib/api";
import { IconSearch, IconArrowRight } from "@/components/icons";

interface ChatTurn {
  query: string;
  reply: string;
  athletes: Athlete[];
}

/**
 * Floating natural-language athlete search for the Scout portal. Sends the
 * free-text query to POST /scouts/{id}/chat, which asks Gemini to translate
 * it into the same sport/ipc_class/state/min_score filters the Discovery
 * page uses (see pipeline/src/llm/gemini_client.py parse_athlete_query) —
 * this is a language front-end onto that existing search, not a separate
 * conversational system, so results are exactly the athletes Discovery would
 * show with those filters applied.
 */
export default function ScoutChatWidget({ scoutId }: { scoutId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setQuery("");
    setLoading(true);
    try {
      const res = await api.post<{ reply: string; athletes: Athlete[] }>(`/scouts/${scoutId}/chat`, { query: q });
      setTurns((t) => [...t, { query: q, reply: res.reply, athletes: res.athletes }]);
    } catch (err: any) {
      setTurns((t) => [...t, { query: q, reply: err.message || "Something went wrong.", athletes: [] }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple text-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center z-50"
        aria-label="Open athlete search chat"
      >
        <IconSearch size={22} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-card border border-border rounded-xl2 shadow-2xl flex flex-col z-50 fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-bold">Ask ParaSync</span>
        <button onClick={() => setOpen(false)} className="text-t3 hover:text-t1 text-lg leading-none">×</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {turns.length === 0 && (
          <p className="text-xs text-t3">
            Try: "T53 basketball players" · "athletes in Karnataka" · "wheelchair tennis scoring above 70"
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="text-sm bg-purple/10 border border-purple/20 rounded-xl px-3 py-2 ml-8">{t.query}</div>
            <div className="text-sm text-t2">{t.reply}</div>
            {t.athletes.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/scout/athlete/${a.id}`}
                className="flex items-center justify-between gap-2 text-xs bg-card2 border border-border rounded-lg px-3 py-2 hover:border-purple/40 transition-colors"
              >
                <span className="truncate">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-t3"> · {a.sport?.replace(/_/g, " ")} · {a.ipc_class}</span>
                </span>
                <IconArrowRight size={12} className="text-t3 shrink-0" />
              </Link>
            ))}
          </div>
        ))}
        {loading && <div className="text-xs text-t3">Searching…</div>}
      </div>

      <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search athletes…"
          className="flex-1 bg-bg-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-purple/40"
        />
        <button type="submit" disabled={loading || !query.trim()} className="px-3 rounded-lg bg-purple text-black text-sm font-semibold disabled:opacity-40">
          →
        </button>
      </form>
    </div>
  );
}
