import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Serif } from "@/components/ui/Serif";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPreviewClientId } from "@/lib/preview";
import { exitPreview } from "@/app/(admin)/admin/preview/actions";

const BASE_LINKS = [
  { href: "/panel", label: "Pulpit" },
  { href: "/panel/dokumenty", label: "Dokumenty" },
  { href: "/panel/uslugi", label: "Usługi" },
  { href: "/panel/kontakt", label: "Kontakt" },
  { href: "/panel/upload", label: "Wyślij pliki" },
  { href: "/panel/chat", label: "Czat" },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, initials")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  const previewId = await getPreviewClientId();
  const isPreview = !!previewId && (profile.role === "admin" || profile.role === "opiekun");

  if (!isPreview) {
    if (profile.role === "admin") redirect("/admin");
    if (profile.role === "opiekun") redirect("/opiekun");
  }

  let client: { id: string; display_short: string; avatar_initials: string; salon_name?: string } | null = null;
  if (isPreview && previewId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clients")
      .select("id, display_short, avatar_initials, salon_name")
      .eq("id", previewId)
      .maybeSingle();
    client = data;
  } else {
    const { data } = await supabase
      .from("clients")
      .select("id, display_short, avatar_initials, salon_name")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    client = data;
  }

  return (
    <>
      {isPreview && client && (
        <div className="preview-banner">
          <div className="preview-banner__inner">
            <span className="preview-banner__dot" />
            <span className="preview-banner__label">
              Podgląd panelu klienta: <strong>{client.salon_name ?? client.display_short}</strong>
            </span>
            <form action={exitPreview}>
              <button type="submit" className="preview-banner__exit">Wyjdź z podglądu →</button>
            </form>
          </div>
        </div>
      )}
      <Navbar
        links={BASE_LINKS}
        userName={client?.display_short ?? profile.full_name}
        userInitials={client?.avatar_initials ?? profile.initials ?? "?"}
      />
      {children}
      <Footer
        quote={<Serif>„Ty prowadzisz salon. My prowadzimy resztę."</Serif>}
      />
    </>
  );
}
