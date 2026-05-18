import { redirect } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { CareCard } from "@/components/client/CareCard";
import { Step } from "@/components/client/Step";
import { getCurrentClientForUser } from "@/lib/db/panel";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function KontaktPage() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("client_opiekun")
    .select("opiekun_user_id, display_order")
    .eq("client_id", client.id)
    .order("display_order");

  const ids = (links ?? []).map((l) => l.opiekun_user_id);
  // Service_role: ominięcie RLS profili opiekunów — bezpieczne (klient widzi tylko swoich).
  const adminSb = createAdminClient();
  const { data: caretakers } = ids.length
    ? await adminSb.from("profiles").select("*").in("id", ids)
    : { data: [] };
  const sortedCaretakers = (caretakers ?? []).slice().sort(
    (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
  );

  const { data: gc } = await supabase.from("global_copy").select("*");
  const g = Object.fromEntries((gc ?? []).map((r) => [r.key, r.value]));

  return (
    <>
      <PageHero
        eyebrowLabel="Panel klienta"
        eyebrowAccent="Kontakt"
        title={<>{sortedCaretakers.map((c) => c.full_name).join(". ")}.</>}
        sub="Twoi opiekunowie strategiczni. Telefon. Mail. WhatsApp. Jeden klik, kontakt."
      />

      <Sec
        closing={<>Nie musisz wiedzieć, kto u nas robi co.<br /><Serif>Wystarczy, że wiesz, do kogo dzwonisz.</Serif></>}
      >
        <div className="care-cards">
          {sortedCaretakers.map((c) => (
            <CareCard
              key={c.id}
              data={{
                fullName: c.full_name,
                initials: c.initials ?? c.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
                role: "Opiekun strategiczny · BeautyRise",
                phone: c.phone ?? "",
                email: c.email ?? "",
                whatsappUrl: c.whatsapp_url ?? undefined,
              }}
            />
          ))}
        </div>

        <div className="care-body">
          <p>Z nimi ustalasz wszystko, co dotyczy Twojego salonu.</p>
          <p>Jeśli ma być prawnik, oni kontaktują prawnika.</p>
          <p>Jeśli ma być reklama, oni uruchamiają zespół reklam.</p>
          <p>Jeśli ma być sprzęt, oni dzwonią do dostawcy.</p>
          <p className="care-body__pause">Ty rozmawiasz z nimi.</p>
          <p className="care-body__pause">Resztę robią oni.</p>
        </div>

        <div className="care-hours">
          <strong>Godziny kontaktu</strong>
          {g["care.hours"] ?? "Pon–Pt, 9:00–18:00. W sprawach pilnych, WhatsApp odbierany do 21:00."}
        </div>
      </Sec>

      <Sec
        dark
        title={<>Trzy rzeczy. <Serif>Tylko tyle.</Serif></>}
        sub={'Bez formularzy. Bez ankiet na 40 pytań. Bez „wypełnij brief i odeślij do końca tygodnia".'}
        closing={<>To wszystko.<br /><Serif>Resztę zbieramy sami.</Serif></>}
      >
        <div className="steps">
          <Step code="01" title="Dostępy" body="Login do Booksy, Instagrama, Facebooka, Google. Jeśli nie pamiętasz haseł, opiekun pokaże, gdzie kliknąć. Krok po kroku, na rozmowie." />
          <Step code="02" title="Jedna liczba" body="Twoja średnia wartość wizyty w ostatnich trzech miesiącach. Nie wiesz? Powiedz, że nie wiesz. To też jest informacja, którą umiemy wykorzystać." />
          <Step code="03" title="Jedno zdanie" body={'Co chcesz mieć za 90 dni, czego nie masz teraz. Bez planu, bez „powinnam", bez tłumaczenia się. Jedno zdanie.'} />
        </div>
      </Sec>

      <Sec
        title={<>BeautyRise: <Serif>firma.</Serif></>}
        sub="Sprawy ogólne i administracyjne. Dla wszystkiego innego, dzwoń do opiekunów."
      >
        <div className="brand-contact">
          {g["brand.email"] && (
            <a href={`mailto:${g["brand.email"]}`} className="brand-contact__item">
              <div className="brand-contact__label">E-mail główny</div>
              <div className="brand-contact__value">{g["brand.email"]}</div>
            </a>
          )}
          {g["brand.website"] && (
            <a href={g["brand.website"]} target="_blank" rel="noopener" className="brand-contact__item">
              <div className="brand-contact__label">Strona</div>
              <div className="brand-contact__value">{g["brand.website"].replace(/^https?:\/\//, "")}</div>
            </a>
          )}
          {g["brand.instagram"] && (
            <a href={g["brand.instagram"]} target="_blank" rel="noopener" className="brand-contact__item">
              <div className="brand-contact__label">Instagram</div>
              <div className="brand-contact__value">@{g["brand.instagram"].split("/").filter(Boolean).pop()}</div>
            </a>
          )}
          {g["brand.facebook"] && (
            <a href={g["brand.facebook"]} target="_blank" rel="noopener" className="brand-contact__item">
              <div className="brand-contact__label">Facebook</div>
              <div className="brand-contact__value">/{g["brand.facebook"].split("/").filter(Boolean).pop()}</div>
            </a>
          )}
        </div>
      </Sec>
    </>
  );
}
