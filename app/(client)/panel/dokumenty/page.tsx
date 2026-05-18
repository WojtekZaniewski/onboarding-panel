import { redirect } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { DocRow } from "@/components/client/DocRow";
import { DocTabs } from "@/components/client/DocTabs";
import { getCurrentClientForUser } from "@/lib/db/panel";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DokumentyPage() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", client.id)
    .order("uploaded_at", { ascending: false });

  const documents = docs ?? [];

  // Signed URLs (1h) — bypass storage RLS przez service_role, bezpieczne bo strona widoczna tylko swojemu klientowi (sesja+RLS na documents już to filtruje).
  const admin = createAdminClient();
  const urls = await Promise.all(
    documents.map(async (d) => {
      if (!d.file_path) return "#";
      const { data } = await admin.storage
        .from("documents")
        .createSignedUrl(d.file_path, 60 * 60);
      return data?.signedUrl ?? "#";
    }),
  );

  return (
    <>
      <PageHero
        eyebrowLabel="Panel klienta"
        eyebrowAccent="Dokumenty"
        title="Dokumenty"
        sub={`${documents.length} ${documents.length === 1 ? "plik" : documents.length < 5 ? "pliki" : "plików"} w archiwum`}
      />

      <Sec>
        <DocTabs
          tabs={[
            { value: "all", label: "Wszystkie" },
            { value: "umowy", label: "Umowy" },
            { value: "brief", label: "Briefy" },
            { value: "rodo", label: "RODO & regulaminy" },
            { value: "faktury", label: "Faktury" },
          ]}
        >
          <ul className="docs">
            {documents.map((d, i) => (
              <DocRow
                key={d.id}
                icon={d.icon ?? "📄"}
                name={d.name}
                meta={d.meta ?? ""}
                category={d.category}
                href={urls[i] ?? "#"}
              />
            ))}
          </ul>
        </DocTabs>
      </Sec>
    </>
  );
}
