import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clientsCount },
    { count: uploadsCount },
    { count: docsCount },
    { count: chatCount },
    { data: recentUploads },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("client_uploads").select("*", { count: "exact", head: true }).eq("status", "nowe"),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("chat_messages").select("*", { count: "exact", head: true }),
    supabase.from("client_uploads").select("id, client_id, kind, caption, created_at, status").order("created_at", { ascending: false }).limit(5),
    supabase.from("clients").select("id, salon_name, display_short, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Dashboard</h1>

      <div className="admin-stats">
        <Link href="/admin/klienci" className="admin-stat">
          <div className="admin-stat__num">{clientsCount ?? 0}</div>
          <div className="admin-stat__label">Klientów</div>
        </Link>
        <div className="admin-stat">
          <div className="admin-stat__num">{uploadsCount ?? 0}</div>
          <div className="admin-stat__label">Nowych plików</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__num">{docsCount ?? 0}</div>
          <div className="admin-stat__label">Dokumentów</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__num">{chatCount ?? 0}</div>
          <div className="admin-stat__label">Wiadomości</div>
        </div>
      </div>

      <div className="admin-cols">
        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Ostatni klienci</h2>
            <Link href="/admin/klienci" className="admin-card__link">Wszyscy →</Link>
          </div>
          <ul className="admin-list">
            {(recentClients ?? []).map((c) => (
              <li key={c.id}>
                <Link href={`/admin/klienci/${c.id}`} className="admin-list__row">
                  <span className="admin-list__title">{c.salon_name}</span>
                  <span className="admin-list__meta">{c.display_short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <div className="admin-card__head">
            <h2>Najnowsze uploady</h2>
          </div>
          <ul className="admin-list">
            {(recentUploads ?? []).length === 0 && (
              <li className="admin-list__empty">Klienci nic jeszcze nie przysłali.</li>
            )}
            {(recentUploads ?? []).map((u) => (
              <li key={u.id}>
                <Link href={`/admin/klienci/${u.client_id}/uploads`} className="admin-list__row">
                  <span className="admin-list__title">{u.caption || u.kind}</span>
                  <span className="admin-list__meta">{u.status} · {new Date(u.created_at).toLocaleDateString("pl-PL")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
