import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminChatOverview() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("id, client_id, created_at")
    .order("created_at", { ascending: false });

  const ids = (threads ?? []).map((t) => t.client_id);
  const { data: clients } = ids.length
    ? await supabase.from("clients").select("id, salon_name, display_short").in("id", ids)
    : { data: [] };

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  // Ostatnia wiadomość w każdym wątku
  const lastMap = new Map<string, { body: string | null; created_at: string }>();
  for (const t of threads ?? []) {
    const { data: last } = await supabase
      .from("chat_messages")
      .select("body, created_at")
      .eq("thread_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last) lastMap.set(t.id, last);
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Wszystkie wątki</h1>
      <div className="admin-table">
        <div className="admin-table__head">
          <span>Klient</span>
          <span>Ostatnia wiadomość</span>
          <span>Kiedy</span>
          <span></span>
        </div>
        {(threads ?? []).map((t) => {
          const c = clientMap.get(t.client_id);
          const last = lastMap.get(t.id);
          return (
            <div key={t.id} className="admin-table__row">
              <span className="admin-table__cell admin-table__cell--strong">
                {c?.salon_name ?? "(brak)"}
              </span>
              <span className="admin-table__cell">
                {last?.body ? (last.body.length > 80 ? last.body.slice(0, 80) + "…" : last.body) : "—"}
              </span>
              <span className="admin-table__cell">
                {last ? new Date(last.created_at).toLocaleString("pl-PL") : "—"}
              </span>
              <span className="admin-table__cell admin-table__cell--right">
                <Link href={`/admin/klienci/${t.client_id}/chat`} className="admin-link">Otwórz →</Link>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
