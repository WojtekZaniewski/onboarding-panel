import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Thread } from "@/components/chat/Thread";
import { createClient } from "@/lib/supabase/server";

export default async function OpiekunChat({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, salon_name, display_short")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) notFound();

  let { data: thread } = await supabase.from("chat_threads").select("id").eq("client_id", clientId).maybeSingle();
  if (!thread) {
    const { data: created } = await supabase.from("chat_threads").insert({ client_id: clientId }).select("id").single();
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
    <div className="admin-page">
      <div className="admin-page__crumbs">
        <Link href="/opiekun">Moi klienci</Link> · <span>{client.salon_name}</span>
      </div>
      <h1 className="admin-page__title">Czat z {client.display_short}</h1>
      <Thread
        threadId={thread.id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        senders={senders}
      />
    </div>
  );
}
