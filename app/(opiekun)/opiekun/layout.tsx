import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function OpiekunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["opiekun", "admin"]);

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link href="/opiekun" className="admin-sidebar__brand">
          <span className="admin-sidebar__mark">BR</span>
          <div>
            <div className="admin-sidebar__name">BeautyRise</div>
            <div className="admin-sidebar__role">Opiekun</div>
          </div>
        </Link>
        <nav className="admin-nav">
          <Link href="/opiekun" className="admin-nav__link" prefetch>Moi klienci</Link>
        </nav>
        <div className="admin-sidebar__user">
          <div className="admin-sidebar__user-name">{profile.full_name}</div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="admin-sidebar__logout">Wyloguj</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
