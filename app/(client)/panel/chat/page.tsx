import { redirect } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { Thread } from "@/components/chat/Thread";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientForUser } from "@/lib/db/panel";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  let { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("client_id", client.id)
    .maybeSingle();

  if (!thread) {
    const { data: created, error } = await supabase
      .from("chat_threads")
      .insert({ client_id: client.id })
      .select("id")
      .single();
    if (error) throw error;
    thread = created;
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id).filter(Boolean) as string[])];
  if (user.id && !senderIds.includes(user.id)) senderIds.push(user.id);

  // dorzuć opiekunów żeby mieć ich avatary w razie pierwszej wiadomości
  const { data: caretakers } = await supabase
    .from("client_opiekun")
    .select("opiekun_user_id")
    .eq("client_id", client.id);
  const careIds = (caretakers ?? []).map((c) => c.opiekun_user_id);
  const allIds = [...new Set([...senderIds, ...careIds])];

  const { data: profiles } = allIds.length
    ? await supabase.from("profiles").select("id, full_name, initials").in("id", allIds)
    : { data: [] };
  const senders = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <>
      <PageHero
        eyebrowLabel="Panel klienta"
        eyebrowAccent="Czat"
        title={<>Krótko, <Serif>na temat.</Serif></>}
        sub="Twoi opiekunowie. Bez maili, bez czekania, bez biletów."
      />
      <Sec>
        <Thread
          threadId={thread.id}
          currentUserId={user.id}
          initialMessages={messages ?? []}
          senders={senders}
        />
      </Sec>
    </>
  );
}
