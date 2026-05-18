import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createNewClient } from "./actions";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: opiekuns } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "opiekun")
    .order("full_name");

  return (
    <div className="admin-page">
      <div className="admin-page__crumbs">
        <Link href="/admin/klienci">Klienci</Link> · <span>Nowy klient</span>
      </div>
      <h1 className="admin-page__title">Dodaj klienta</h1>
      <p className="admin-page__subtitle">
        Tworzy konto logowania + panel z domyślnymi sekcjami.
      </p>

      {params.error && (
        <div className="login-card__notice login-card__notice--err" style={{ marginBottom: 24 }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createNewClient} className="admin-form admin-form--inline" style={{ maxWidth: 820 }}>
        <h3 style={{ gridColumn: "1 / -1" }}>Logowanie klientki</h3>

        <label className="admin-field">
          <span>Imię i nazwisko</span>
          <input name="full_name" required placeholder="Anna Kowalska" />
        </label>
        <label className="admin-field">
          <span>E-mail (login)</span>
          <input name="email" type="email" required placeholder="anna@salon-wenus.pl" />
        </label>
        <label className="admin-field">
          <span>Hasło startowe</span>
          <input name="password" type="text" required minLength={8} placeholder="min. 8 znaków" />
        </label>

        <h3 style={{ gridColumn: "1 / -1", marginTop: 20 }}>Salon i wygląd panelu</h3>

        <label className="admin-field">
          <span>Nazwa salonu</span>
          <input name="salon_name" required placeholder="Salon Wenus" />
        </label>
        <label className="admin-field">
          <span>Imię w hero (np. „Anno")</span>
          <input name="display_first_name" required placeholder="Anno" />
        </label>
        <label className="admin-field">
          <span>Skrót w navbarze</span>
          <input name="display_short" placeholder="Anna K. (auto z imienia)" />
        </label>
        <label className="admin-field admin-field--narrow">
          <span>Inicjały awatara</span>
          <input name="avatar_initials" placeholder="AK (auto)" maxLength={3} />
        </label>

        <h3 style={{ gridColumn: "1 / -1", marginTop: 20 }}>Opiekunowie</h3>

        <div className="admin-field admin-field--full">
          <span>Przypisz opiekunów strategicznych</span>
          <div className="admin-checkbox-list">
            {(opiekuns ?? []).map((o) => (
              <label key={o.id} className="admin-checkbox">
                <input type="checkbox" name="opiekun_ids" value={o.id} defaultChecked />
                <span>{o.full_name} <em>({o.email})</em></span>
              </label>
            ))}
            {(opiekuns ?? []).length === 0 && (
              <p className="admin-hint">Brak opiekunów w systemie. Dodaj ich najpierw w Supabase Authentication.</p>
            )}
          </div>
        </div>

        <h3 style={{ gridColumn: "1 / -1", marginTop: 20 }}>Start</h3>

        <label className="admin-field admin-field--checkbox admin-field--full">
          <input type="checkbox" name="seed_defaults" defaultChecked />
          <span>
            Zalej domyślne sekcje (status pills „Sprawa aktywna", plan D1–D90, powiadomienie powitalne)
          </span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn--primary">Utwórz klienta</button>
          <Link href="/admin/klienci" className="btn btn--ghost btn--small">Anuluj</Link>
        </div>
      </form>
    </div>
  );
}
