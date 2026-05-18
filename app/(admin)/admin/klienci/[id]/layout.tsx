import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, salon_name, display_short")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const tabs = [
    { href: `/admin/klienci/${id}`, label: "Pulpit" },
    { href: `/admin/klienci/${id}/uploads`, label: "Pliki od klienta" },
    { href: `/admin/klienci/${id}/chat`, label: "Czat" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__crumbs">
        <Link href="/admin/klienci">← Wszyscy klienci</Link>
      </div>

      <nav className="admin-subnav">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="admin-subnav__link">
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
