import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function OpiekunDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: links } = await supabase
    .from("client_opiekun")
    .select("client_id")
    .eq("opiekun_user_id", user.id);

  const clientIds = (links ?? []).map((l) => l.client_id);
  const { data: clients } = clientIds.length
    ? await supabase.from("clients").select("id, salon_name, display_short, case_status").in("id", clientIds)
    : { data: [] };

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Moi klienci</h1>
      <p className="admin-hint">Klienci, do których jesteś przypisana/y jako opiekun strategiczny.</p>

      <div className="admin-table">
        <div className="admin-table__head">
          <span>Salon</span>
          <span>Reprezentant</span>
          <span>Status</span>
          <span></span>
        </div>
        {(clients ?? []).map((c) => (
          <div key={c.id} className="admin-table__row">
            <span className="admin-table__cell admin-table__cell--strong">{c.salon_name}</span>
            <span className="admin-table__cell">{c.display_short}</span>
            <span className="admin-table__cell">
              <span className="admin-pill">{c.case_status}</span>
            </span>
            <span className="admin-table__cell admin-table__cell--right">
              <Link href={`/opiekun/chat/${c.id}`} className="admin-link">Czat →</Link>
            </span>
          </div>
        ))}
        {(clients ?? []).length === 0 && (
          <div className="admin-table__empty">Nie jesteś przypisana/y do żadnego klienta.</div>
        )}
      </div>
    </div>
  );
}
