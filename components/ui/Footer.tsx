import Link from "next/link";
import type { ReactNode } from "react";

export function Footer({ quote }: { quote?: ReactNode }) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__mark">BR</span>
          BeautyRise · panel klienta
        </div>
        {quote && <p className="footer__quote">{quote}</p>}
        <div className="footer__links">
          <Link href="/panel/kontakt">Pomoc</Link>
          <a href="#">Regulamin</a>
          <a href="#">Prywatność</a>
          <form action="/auth/signout" method="post" style={{ display: "inline" }}>
            <button type="submit" className="footer__logout" style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>
              Wyloguj
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
