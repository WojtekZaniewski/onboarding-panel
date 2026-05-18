import { notFound } from "next/navigation";
import { Thread } from "@/components/chat/Thread";
import { createClient } from "@/lib/supabase/server";

export default async function ClientChatAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("client_id", id)
    .maybeSingle();

  if (!thread) {
    const { data: created } = await supabase.from("chat_threads").insert({ client_id: id }).select("id").single();
    thread = created!;
  }
  if (!thread) notFound();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id).filter(Boolean) as string[])];
  if (!senderIds.includes(user.id)) senderIds.push(user.id);

  const { data: profiles } = senderIds.length
    ? await supabase.from("profiles").select("id, full_name, initials").in("id", senderIds)
    : { data: [] };
  const senders = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <section className="admin-form-section">
      <h2>Wątek z klientem</h2>
      <Thread
        threadId={thread.id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        senders={senders}
      />
    </section>
  );
}
