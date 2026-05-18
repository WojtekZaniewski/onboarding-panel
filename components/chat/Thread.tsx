"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
};

type Sender = { id: string; full_name: string; initials: string | null };

export function Thread({
  threadId,
  currentUserId,
  initialMessages,
  senders,
}: {
  threadId: string;
  currentUserId: string;
  initialMessages: Message[];
  senders: Record<string, Sender>;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, sender_id: currentUserId, body: text })
      .select()
      .single();
    setSending(false);
    if (error) {
      alert("Nie wysłano: " + error.message);
      return;
    }
    setBody("");
    if (data) setMessages((prev) => [...prev, data as Message]);
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread__messages" ref={scrollRef}>
        {messages.length === 0 && <div className="chat-thread__empty">Brak wiadomości. Napisz pierwszą.</div>}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          const s = m.sender_id ? senders[m.sender_id] : null;
          return (
            <div key={m.id} className={"chat-msg" + (isMe ? " chat-msg--me" : "")}>
              {!isMe && s && (
                <div className="chat-msg__avatar">{s.initials ?? s.full_name.slice(0, 2).toUpperCase()}</div>
              )}
              <div className="chat-msg__bubble">
                {!isMe && s && <div className="chat-msg__sender">{s.full_name}</div>}
                <div className="chat-msg__body">{m.body}</div>
                <div className="chat-msg__time">
                  {new Date(m.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form className="chat-composer" onSubmit={send}>
        <input
          className="chat-composer__input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Napisz wiadomość…"
          disabled={sending}
        />
        <button type="submit" className="btn btn--primary btn--small" disabled={sending || !body.trim()}>
          Wyślij
        </button>
      </form>
    </div>
  );
}
