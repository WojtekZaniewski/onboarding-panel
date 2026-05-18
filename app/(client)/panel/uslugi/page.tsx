import { redirect } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { ServiceCard, type ServiceStatus } from "@/components/client/ServiceCard";
import { Principle } from "@/components/client/Principle";
import { getCurrentClientForUser } from "@/lib/db/panel";
import { createClient } from "@/lib/supabase/server";

export default async function UslugiPage() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("client_id", client.id)
    .order("display_order");

  return (
    <>
      <PageHero
        eyebrowLabel="Panel klienta"
        eyebrowAccent="Usługi"
        title="Usługi"
        sub="Status każdej usługi na żywo."
      />

      <Sec wide>
        <div className="services">
          {(services ?? []).map((s) => (
            <ServiceCard
              key={s.id}
              icon={s.icon ?? ""}
              status={(s.status as ServiceStatus) ?? "default"}
              title={s.title}
              body={s.body ?? ""}
              link={s.link_href && s.link_label ? { href: s.link_href, label: s.link_label } : undefined}
            />
          ))}
        </div>
      </Sec>

      <Sec
        dark
        title="Zasady"
        sub="Czego nie obiecujemy."
      >
        <div className="principles">
          <Principle num="01" title="Nie spodziewaj się klientek w pierwszym tygodniu." paragraphs={[
            "Marketing salonu beauty to nie reklama burgera.",
            "Decyzja kobiety o zmianie kosmetyczki dojrzewa 2–6 tygodni.",
            "Pierwsze realne efekty: trzeci, czwarty tydzień. Skala: drugi, trzeci miesiąc.",
          ]} />
          <Principle num="02" title="Nie będziemy Cię gonić." paragraphs={[
            "Nie dostaniesz ośmiu maili tygodniowo z prośbą o feedback.",
            "Pracujemy. Raportujemy raz w miesiącu.",
            "Jeśli coś jest pilne, to my piszemy do Ciebie, nie odwrotnie.",
          ]} />
          <Principle num="03" title="Nie wszystko da się zrobić od razu." paragraphs={[
            "Jest kolejność. Najpierw analiza, potem fundament, potem skalowanie.",
            "Salony, które urosły, urosły w określonej kolejności. Twój też urośnie w tej kolejności.",
          ]} />
          <Principle num="04" title="Nie pytaj nas o wszystko." paragraphs={[
            "Pytaj o decyzje, których nie chcesz podejmować sama.",
            "Reszta to nasza praca, bez konsultowania każdej grafiki, każdej kreacji, każdego SMS-a.",
            "Po to nas masz.",
          ]} />
        </div>
      </Sec>
    </>
  );
}
