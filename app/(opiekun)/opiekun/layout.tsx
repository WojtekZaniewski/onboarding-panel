import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function OpiekunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.role !== "opiekun" && profile.role !== "admin") redirect("/panel");

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
          <Link href="/opiekun" className="admin-nav__link">Moi klienci</Link>
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
