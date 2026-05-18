import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin"]);

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar__brand">
          <span className="admin-sidebar__mark">BR</span>
          <div>
            <div className="admin-sidebar__name">BeautyRise</div>
            <div className="admin-sidebar__role">Admin</div>
          </div>
        </Link>
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav__link" prefetch>Dashboard</Link>
          <Link href="/admin/klienci" className="admin-nav__link" prefetch>Klienci</Link>
          <Link href="/admin/chat" className="admin-nav__link" prefetch>Wszystkie wątki</Link>
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
