import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { enterPreview } from "@/app/(admin)/admin/preview/actions";

export default async function KlienciList() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, salon_name, display_short, display_first_name, case_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Klienci</h1>
        <Link href="/admin/klienci/nowy" className="btn btn--primary btn--small">+ Dodaj klienta</Link>
      </div>

      <div className="admin-table">
        <div className="admin-table__head">
          <span>Salon</span>
          <span>Reprezentant</span>
          <span>Imię (hero)</span>
          <span>Status</span>
          <span></span>
        </div>
        {(clients ?? []).map((c) => (
          <div key={c.id} className="admin-table__row">
            <span className="admin-table__cell admin-table__cell--strong">{c.salon_name}</span>
            <span className="admin-table__cell">{c.display_short}</span>
            <span className="admin-table__cell">{c.display_first_name}</span>
            <span className="admin-table__cell">
              <span className="admin-pill">{c.case_status}</span>
            </span>
            <span className="admin-table__cell admin-table__cell--right admin-table__actions">
              <form action={enterPreview.bind(null, c.id)} style={{ display: "inline" }}>
                <button type="submit" className="admin-link admin-link--button">👁 Podgląd</button>
              </form>
              <Link href={`/admin/klienci/${c.id}`} className="admin-link">Edytuj →</Link>
            </span>
          </div>
        ))}
        {(clients ?? []).length === 0 && (
          <div className="admin-table__empty">Brak klientów. Dodaj pierwszego.</div>
        )}
      </div>
    </div>
  );
}
