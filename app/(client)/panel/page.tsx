import { redirect } from "next/navigation";
import { HeroScramble } from "@/components/ui/HeroScramble";
import { StatusPill } from "@/components/ui/StatusPill";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { Btn } from "@/components/ui/Btn";
import { ClosingSec } from "@/components/ui/ClosingSec";
import { ServiceCard, type ServiceStatus } from "@/components/client/ServiceCard";
import { DocRow } from "@/components/client/DocRow";
import { NotifRow } from "@/components/client/NotifRow";
import { CalItem } from "@/components/client/CalItem";
import { CareCard } from "@/components/client/CareCard";
import { Step, type StepStatus } from "@/components/client/Step";
import { Asset } from "@/components/client/Asset";
import { FeatureCard } from "@/components/client/FeatureCard";
import { getCurrentClientForUser, getFullPanelData } from "@/lib/db/panel";

const PL_MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function fmtDate(iso: string): { day: string; month: string } {
  const d = new Date(iso + "T00:00:00");
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: PL_MONTHS[d.getMonth()] ?? "",
  };
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export default async function PanelHome() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const data = await getFullPanelData(client.id);
  if (!data) redirect("/login");

  const {
    statusPills,
    services,
    documents,
    calendar,
    notifications,
    reports,
    assets,
    plan,
    caretakers,
    global,
    reportEntries,
    currentWork,
  } = data;

  const recentDocs = documents.slice(0, 3);
  const nextReport = reports[0];
  const reportDays = nextReport ? daysUntil(nextReport.published_at) : null;

  const visible = (data.client.visible_sections ?? {}) as Record<string, boolean>;
  const show = (key: string) => visible[key] !== false;

  return (
    <>
      <header className="hero">
        <div className="hero__eyebrow">
          {data.client.hero_eyebrow} · <span>{data.client.salon_name}</span>
        </div>
        <HeroScramble
          className="hero__heading"
          segments={[
            { text: "Witaj z powrotem, " },
            { text: data.client.display_first_name + ".", italic: true },
          ]}
        />
        <p className="hero__sub">{data.client.hero_sub}</p>
        <p className="hero__micro">
          {data.client.hero_micro.split(" Tu.")[0]} <strong>Tu.</strong>
        </p>

        {statusPills.length > 0 && (
          <div className="status-pills">
            {statusPills.map((p) => (
              <StatusPill
                key={p.id}
                variant={(p.variant as "default" | "ok" | "accent") ?? "default"}
                icon={p.icon || undefined}
                dot={p.variant === "ok"}
              >
                {p.label}
              </StatusPill>
            ))}
          </div>
        )}
      </header>

      {show("documents") && <Sec
        dark
        num="01"
        title={<>Twoje dokumenty. <Serif>Jedno miejsce.</Serif></>}
        sub="Umowa, faktury, załączniki, regulaminy. Nie szukasz. Nie pytasz. Klikasz i pobierasz."
        headRow={<Btn href="/panel/dokumenty" variant="ghost" small>Wszystkie dokumenty</Btn>}
        closing={<>Część właścicielek salonów traci godziny na szukanie papierów w skrzynce.<br /><Serif>Ty już nie.</Serif></>}
      >
        <ul className="docs">
          {recentDocs.map((d) => (
            <DocRow key={d.id} icon={d.icon} name={d.name} meta={d.meta ?? ""} />
          ))}
        </ul>
      </Sec>}

      {show("services") && <Sec
        wide
        num="02"
        title={<>Wiesz co się dzieje. <Serif>W czasie rzeczywistym.</Serif></>}
        sub="Kampanie reklamowe, content, automatyzacje, dofinansowania, ochrona prawna. Każda usługa ma status."
        headRow={<Btn href="/panel/uslugi" variant="ghost" small>Wszystkie usługi</Btn>}
        closing={<>Zero domysłów. Zero „a co tam słychać u was."<br /><Serif>Wchodzisz. Widzisz. Idziesz dalej.</Serif></>}
      >
        <div className="services">
          {services.map((s) => (
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
      </Sec>}

      {show("current_work") && currentWork.length > 0 && <Sec
        wide
        num="⚡"
        title={<>Nad czym <Serif>aktualnie pracujemy.</Serif></>}
        sub="Live update od Twojego zespołu BeautyRise."
      >
        <ul className="current-work-list">
          {currentWork.map((w) => (
            <li key={w.id} className="current-work-item">
              <span className="current-work-item__bullet">⚡</span>
              <div>
                <div className="current-work-item__title">{w.title}</div>
                {w.detail && <div className="current-work-item__detail">{w.detail}</div>}
              </div>
            </li>
          ))}
        </ul>
      </Sec>}

      {show("report_entries") && reportEntries.length > 0 && <Sec
        dark
        num="📋"
        title={<>Raporty <Serif>w skrócie.</Serif></>}
        sub="Krótkie wpisy zamiast pełnych PDF-ów. Po jednym kliknięciu wiesz, co się działo."
        closing={<>Każdy miesiąc, jedno zdanie. <Serif>Wystarczy.</Serif></>}
      >
        <ul className="report-entries-list">
          {reportEntries.map((r) => (
            <li key={r.id} className="report-entry">
              <div className="report-entry__period">{r.period}</div>
              <div className="report-entry__content">{r.content}</div>
            </li>
          ))}
        </ul>
      </Sec>}

      {show("opiekunowie") && <Sec
        dark
        id="kontakt"
        num="03"
        title={<>{caretakers.map((c) => c.full_name).join(". ")}.</>}
        sub="Twoi opiekunowie strategiczni. Telefon. Mail. WhatsApp. Jeden klik, kontakt."
        closing={<>Nie „skontaktuj się z biurem." Nie „nasz zespół odpisze w ciągu 48h."<br /><Serif>Konkretna osoba. Teraz.</Serif></>}
      >
        <div className="care-cards">
          {caretakers.map((c) => (
            <CareCard
              key={c.id}
              data={{
                fullName: c.full_name,
                initials: c.initials ?? c.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
                role: "Opiekun strategiczny · BeautyRise",
                phone: c.phone ?? "",
                email: c.email ?? "",
                whatsappUrl: c.whatsapp_url ?? undefined,
              }}
            />
          ))}
        </div>
      </Sec>}

      {show("reports") && <Sec
        num="04"
        title={<>Co miesiąc: <Serif>liczby, wnioski, plan.</Serif></>}
        sub="Każdy miesiąc współpracy zarchiwizowany w PDF. Co zrobiliśmy. Co zadziałało. Co robimy dalej."
        closing={<>Większość właścicielek salonów nie wie, co przyniosło im klientki w zeszłym miesiącu.<br /><Serif>Ty wiesz.</Serif></>}
      >
        <FeatureCard
          label="Najbliższy raport"
          title={nextReport?.period ?? "Maj 2026"}
          meta={
            nextReport?.published_at
              ? `Trafia do panelu ${nextReport.published_at}${reportDays !== null ? ` · za ${reportDays} dni` : ""}`
              : "Pierwszy raport po 30 dniach współpracy"
          }
          stats={[
            { num: String(reports.length), label: "raportów w archiwum" },
            { num: "PDF", label: "format · ~12 stron" },
          ]}
        />
      </Sec>}

      {show("plan") && <Sec
        dark
        num="05"
        title={<>Tu jest <Serif>Twoja mapa.</Serif></>}
        sub={'Plan ustalony na kick-offie. Co robimy, w jakiej kolejności, kiedy spodziewać się efektów. Bez mgły. Bez „zobaczymy."'}
        closing={<>Wiesz co jest następne.<br /><Serif>Wiesz kiedy.</Serif></>}
      >
        <div className="steps">
          {plan.map((m) => (
            <Step
              key={m.id}
              code={m.code}
              title={m.title}
              status={(m.badge_status as StepStatus) ?? "upcoming"}
              body={m.body ?? ""}
            />
          ))}
        </div>
      </Sec>}

      {show("calendar") && <Sec
        wide
        num="06"
        title={<>Co się publikuje. <Serif>Kiedy. Gdzie.</Serif></>}
        sub="Posty, reklamy, stories, reels — zaplanowane, opisane, gotowe. Możesz zajrzeć i sprawdzić kreację przed publikacją. Możesz też nie."
        closing={<>Twój salon wygląda profesjonalnie nawet kiedy <Serif>śpisz.</Serif></>}
      >
        <ul className="calendar">
          {calendar.map((c) => {
            const { day, month } = fmtDate(c.publish_date);
            return (
              <CalItem
                key={c.id}
                day={day}
                month={month}
                title={c.title}
                meta={c.meta ?? ""}
                channel={c.channel ?? ""}
              />
            );
          })}
        </ul>
      </Sec>}

      {show("assets") && <Sec
        dark
        wide
        num="07"
        title={<>Twoja marka, <Serif>pod ręką.</Serif></>}
        sub="Logo, paleta kolorów, zdjęcia salonu, materiały marki. Do pobrania. Zawsze aktualne."
        closing={<>Marka spójna. <Serif>Spójna marka wygrywa.</Serif></>}
      >
        <div className="assets">
          {assets.map((a) => (
            <Asset
              key={a.id}
              iconText={a.icon_text ?? undefined}
              iconStyle={a.icon_gradient ? { background: a.icon_gradient } : undefined}
              title={a.title}
              meta={a.meta ?? ""}
            />
          ))}
        </div>
      </Sec>}

      {show("notifications") && <Sec
        num="08"
        title={<>Nic Cię <Serif>nie ominie.</Serif></>}
        sub="Nowy raport, nowa faktura, nowy materiał do zatwierdzenia — powiadomienie. System pracuje. Ty decydujesz kiedy zajrzeć."
      >
        <ul className="notifs">
          {notifications.map((n) => (
            <NotifRow
              key={n.id}
              isNew={n.is_new}
              title={n.title}
              meta={n.meta ?? ""}
              actionHref={n.action_url ?? "#"}
            />
          ))}
        </ul>
      </Sec>}

      <ClosingSec
        lead={
          <>
            {global["closing.lead_a"] ?? "Inne salony walczą z chaosem."}
            <br />
            <Serif>{global["closing.lead_b"] ?? "Ty masz kogoś, kto go ogarnia."}</Serif>
          </>
        }
        body={global["closing.body"]}
        tag={
          <>
            {(global["closing.tag"] ?? "Ty prowadzisz salon. My prowadzimy resztę.").split(".")[0] + "."}{" "}
            <Serif>
              {(global["closing.tag"] ?? "Ty prowadzisz salon. My prowadzimy resztę.")
                .split(".")
                .slice(1)
                .join(".")
                .trim()}
            </Serif>
          </>
        }
        ctaIntro={global["closing.cta_intro"]}
        buttons={
          <>
            {caretakers.map((c) => (
              <Btn
                key={c.id}
                href={`tel:${(c.phone ?? "").replace(/\s/g, "")}`}
                variant="primary"
              >
                Zadzwoń do {c.full_name.split(" ")[0]}
              </Btn>
            ))}
          </>
        }
      />
    </>
  );
}
