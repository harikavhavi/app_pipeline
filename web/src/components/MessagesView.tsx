"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, Input, Button, Spinner, EmptyState } from "@/components/ui";
import { IconMessage, IconUser, IconArrowLeft } from "@/components/icons";

type Thread = { id: string; name: string };
type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default function MessagesView({ role }: { role: "scout" | "coach" }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: Thread[] }>(`/${role}s/${user.id}/athletes`)
      .then((d) => setThreads(d.athletes))
      .finally(() => setLoading(false));
  }, [user, role]);

  useEffect(() => {
    if (!active || !user) return;
    let stop = false;
    async function poll() {
      const d = await api.get<{ messages: Msg[] }>(
        `/messages?thread_type=${role}&athlete_id=${active!.id}&counterpart_id=${user!.id}`
      );
      if (!stop) setMessages(d.messages);
    }
    poll();
    const iv = setInterval(poll, 3000);
    return () => { stop = true; clearInterval(iv); };
  }, [active, user, role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !active || !user) return;
    const body = draft.trim();
    setDraft("");
    await api.post("/messages", {
      thread_type: role,
      athlete_id: active.id,
      counterpart_id: user.id,
      sender_id: user.id,
      body,
    });
    const d = await api.get<{ messages: Msg[] }>(
      `/messages?thread_type=${role}&athlete_id=${active.id}&counterpart_id=${user.id}`
    );
    setMessages(d.messages);
  }

  if (loading) return <Spinner className="mx-auto my-12" />;

  if (active) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setActive(null)} className="flex items-center gap-1.5 text-t3 hover:text-t1 text-sm mb-4">
          <IconArrowLeft size={15} /> Back to messages
        </button>
        <Card className="flex flex-col h-[520px]">
          <div className="p-4 border-b border-border font-semibold">{active.name}</div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-t3 text-sm text-center mt-10">No messages yet — say hello</p>}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      mine ? "bg-cyan text-black rounded-br-sm" : "bg-card2 text-t1 rounded-bl-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button onClick={send}>Send</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (threads.length === 0) {
    return <EmptyState icon={<IconMessage size={36} />} title="No conversations yet" sub="Connect with an athlete to start chatting" />;
  }

  return (
    <div className="max-w-2xl">
      {threads.map((t) => (
        <Card key={t.id} className="p-4 flex items-center gap-3 mb-3 cursor-pointer hover:border-t3/40 transition-colors" onClick={() => setActive(t)}>
          <div className="w-10 h-10 rounded-full bg-card2 border border-border flex items-center justify-center">
            <IconUser size={16} className="text-t2" />
          </div>
          <div className="font-semibold">{t.name}</div>
        </Card>
      ))}
    </div>
  );
}
