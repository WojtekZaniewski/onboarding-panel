import Link from "next/link";
import { createNewClient } from "./actions";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="admin-page">
      <div className="admin-page__crumbs">
        <Link href="/admin/klienci">← Wszyscy klienci</Link>
      </div>
      <h1 className="admin-page__title">Nowy klient</h1>
      <p className="admin-page__subtitle">Wpisz dane. Hasło wygenerujemy automatycznie.</p>

      {params.error && (
        <div className="login-card__notice login-card__notice--err" style={{ marginBottom: 24 }}>
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createNewClient} className="new-client-form">
        <label className="admin-field">
          <span>Imię i nazwisko klientki</span>
          <input name="full_name" required placeholder="Anna Kowalska" autoFocus />
        </label>

        <label className="admin-field">
          <span>Nazwa salonu</span>
          <input name="salon_name" required placeholder="Salon Wenus" />
        </label>

        <label className="admin-field">
          <span>E-mail (login klientki)</span>
          <input name="email" type="email" required placeholder="anna@salon-wenus.pl" />
        </label>

        <label className="admin-field">
          <span>Imię w wołaczu <em className="admin-field__hint">(opcjonalne, np. „Anno")</em></span>
          <input name="display_first_name" placeholder="zostaw puste — użyjemy imienia" />
        </label>

        <div className="admin-form__actions">
          <button type="submit" className="btn btn--primary">Utwórz klienta</button>
          <Link href="/admin/klienci" className="btn btn--ghost btn--small">Anuluj</Link>
        </div>
      </form>
    </div>
  );
}
