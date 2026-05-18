import { Serif } from "@/components/ui/Serif";
import { signInWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__eyebrow">BeautyRise · Panel klienta</div>
        <h1 className="login-card__title">
          Wracasz <Serif>do siebie.</Serif>
        </h1>
        <p className="login-card__sub">
          Zaloguj się e-mailem i hasłem. Po zalogowaniu trafisz tam, gdzie masz dostęp.
        </p>
        {error && (
          <div className="login-card__notice login-card__notice--err">
            {decodeURIComponent(error)}
          </div>
        )}
        <form className="login-form" action={signInWithPassword}>
          <input
            type="email"
            name="email"
            placeholder="ty@twojsalon.pl"
            required
            autoComplete="email"
            className="login-form__input"
          />
          <input
            type="password"
            name="password"
            placeholder="hasło"
            required
            autoComplete="current-password"
            className="login-form__input"
          />
          <button type="submit" className="btn btn--primary login-form__submit">
            Zaloguj się
          </button>
        </form>
        <p className="login-card__hint">
          Konta testowe (po seedzie): <code>kontakt@beautyrise.pl</code> /{" "}
          <code>anna@salon-wenus.pl</code> / <code>jakub@beautyrise.pl</code> /{" "}
          <code>wojtek@beautyrise.pl</code>.
        </p>
      </div>
    </main>
  );
}
