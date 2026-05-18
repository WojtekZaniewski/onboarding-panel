import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { Btn } from "@/components/ui/Btn";
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
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const SERVICE_STATUS_LABEL: Record<string, string> = {
  w_robocie: "W robocie",
  czeka: "Czeka",
  dostarczone: "Dostarczone",
};
const SERVICE_STATUS_CLASS: Record<string, string> = {
  w_robocie: "pchip--ok",
  czeka: "pchip--warn",
  dostarczone: "pchip--done",
};
const PLAN_BADGE_LABEL: Record<string, string> = {
  done: "Zrobione",
  active: "W toku",
  upcoming: "Wkrótce",
};
const PLAN_BADGE_CLASS: Record<string, string> = {
  done: "pchip--done",
  active: "pchip--ok",
  upcoming: "pchip--muted",
};

export default async function PanelHome() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const data = await getFullPanelData(client.id);
  if (!data) redirect("/login");

  const {
    statusPills, services, documents, calendar, notifications,
    reports, assets, plan, caretakers, reportEntries, currentWork,
  } = data;

  const visible = (data.client.visible_sections ?? {}) as Record<string, boolean>;
  const show = (key: string) => visible[key] !== false;

  const nextReport = reports[0];
  const reportDays = nextReport ? daysUntil(nextReport.published_at) : null;
  const newNotifs = notifications.filter((n) => n.is_new);

  return (
    <main className="panel">
      {/* Top: greeting + status pills */}
      <header className="panel-top">
        <div>
          <div className="panel-top__eyebrow">{data.client.salon_name}</div>
          <h1 className="panel-top__title">Cześć {data.client.display_first_name.replace(/\.$/, "")}</h1>
        </div>
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

      <div className="panel-grid">
        {/* Status usług */}
        {show("services") && (
          <section className="panel-tile panel-tile--wide">
            <div className="panel-tile__head">
              <h2>Usługi</h2>
              <Link href="/panel/uslugi" className="panel-tile__more">Wszystkie →</Link>
            </div>
            <ul className="panel-list">
              {services.slice(0, 6).map((s) => (
                <li key={s.id} className="panel-list__row">
                  <span className="panel-list__icon">{s.icon ?? "•"}</span>
                  <span className="panel-list__title">{s.title}</span>
                  <span className={`pchip ${SERVICE_STATUS_CLASS[s.status] ?? "pchip--muted"}`}>
                    {SERVICE_STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </li>
              ))}
              {services.length === 0 && <li className="panel-empty">Brak.</li>}
            </ul>
          </section>
        )}

        {/* Nad czym pracujemy */}
        {show("current_work") && currentWork.length > 0 && (
          <section className="panel-tile">
            <div className="panel-tile__head">
              <h2>Nad czym pracujemy</h2>
              <span className="panel-tile__count">{currentWork.length}</span>
            </div>
            <ul className="panel-list">
              {currentWork.slice(0, 5).map((w) => (
                <li key={w.id} className="panel-list__row panel-list__row--accent">
                  <span className="panel-list__icon">⚡</span>
                  <span className="panel-list__title">{w.title}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Najbliższy raport */}
        {show("reports") && (
          <section className="panel-tile">
            <div className="panel-tile__head">
              <h2>Najbliższy raport</h2>
            </div>
            {nextReport ? (
              <div className="panel-bigstat">
                <div className="panel-bigstat__num">{nextReport.period}</div>
                <div className="panel-bigstat__meta">
                  {reportDays !== null && reportDays > 0 && `za ${reportDays} dni`}
                  {reportDays === 0 && "dziś"}
                  {(reportDays === null || reportDays < 0) && (nextReport.published_at ?? "—")}
                </div>
              </div>
            ) : (
              <div className="panel-bigstat">
                <div className="panel-bigstat__num">—</div>
                <div className="panel-bigstat__meta">Pierwszy raport po 30 dniach</div>
              </div>
            )}
            <div className="panel-tile__footer">
              <span className="panel-meta">{reports.length} w archiwum</span>
            </div>
          </section>
        )}

        {/* Plan 30/90 */}
        {show("plan") && plan.length > 0 && (
          <section className="panel-tile panel-tile--wide">
            <div className="panel-tile__head">
              <h2>Plan 30 / 90</h2>
            </div>
            <ul className="panel-list">
              {plan.map((m) => (
                <li key={m.id} className="panel-list__row">
                  <span className="panel-list__code">{m.code}</span>
                  <span className="panel-list__title">{m.title}</span>
                  <span className={`pchip ${PLAN_BADGE_CLASS[m.badge_status ?? "upcoming"]}`}>
                    {PLAN_BADGE_LABEL[m.badge_status ?? "upcoming"]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Dokumenty (najnowsze) */}
        {show("documents") && (
          <section className="panel-tile">
            <div className="panel-tile__head">
              <h2>Dokumenty</h2>
              <Link href="/panel/dokumenty" className="panel-tile__more">Wszystkie →</Link>
            </div>
            <ul className="panel-list">
              {documents.slice(0, 4).map((d) => (
                <li key={d.id} className="panel-list__row">
                  <span className="panel-list__icon">{d.icon ?? "📄"}</span>
                  <span className="panel-list__title">{d.name}</span>
                </li>
              ))}
              {documents.length === 0 && <li className="panel-empty">Brak dokumentów.</li>}
            </ul>
          </section>
        )}

        {/* Powiadomienia */}
        {show("notifications") && (
          <section className="panel-tile">
            <div className="panel-tile__head">
              <h2>Powiadomienia</h2>
              {newNotifs.length > 0 && <span className="pchip pchip--accent">{newNotifs.length} nowych</span>}
            </div>
            <ul className="panel-list">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="panel-list__row">
                  {n.is_new && <span className="panel-list__dot" />}
                  <span className="panel-list__title">{n.title}</span>
                </li>
              ))}
              {notifications.length === 0 && <li className="panel-empty">Brak.</li>}
            </ul>
          </section>
        )}

        {/* Kalendarz */}
        {show("calendar") && calendar.length > 0 && (
          <section className="panel-tile panel-tile--wide">
            <div className="panel-tile__head">
              <h2>Kalendarz</h2>
              <span className="panel-tile__count">{calendar.length}</span>
            </div>
            <ul className="panel-list">
              {calendar.slice(0, 5).map((c) => {
                const { day, month } = fmtDate(c.publish_date);
                return (
                  <li key={c.id} className="panel-list__row">
                    <span className="panel-list__date">
                      <span className="panel-list__date-day">{day}</span>
                      <span className="panel-list__date-month">{month}</span>
                    </span>
                    <span className="panel-list__title">{c.title}</span>
                    {c.channel && <span className="pchip pchip--muted">{c.channel}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Opiekunowie */}
        {show("opiekunowie") && caretakers.length > 0 && (
          <section className="panel-tile panel-tile--wide">
            <div className="panel-tile__head">
              <h2>Opiekunowie</h2>
              <Link href="/panel/kontakt" className="panel-tile__more">Kontakt →</Link>
            </div>
            <div className="panel-caretakers">
              {caretakers.map((c) => (
                <div key={c.id} className="panel-caretaker">
                  <div className="panel-caretaker__avatar">
                    {c.initials ?? c.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="panel-caretaker__info">
                    <div className="panel-caretaker__name">{c.full_name}</div>
                    <div className="panel-caretaker__role">Opiekun strategiczny</div>
                  </div>
                  <div className="panel-caretaker__actions">
                    {c.phone && <Btn href={`tel:${c.phone.replace(/\s/g, "")}`} variant="primary" small>Zadzwoń</Btn>}
                    {c.whatsapp_url && <Btn href={c.whatsapp_url} variant="ghost" small target="_blank" rel="noopener">WhatsApp</Btn>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Brand assets */}
        {show("assets") && assets.length > 0 && (
          <section className="panel-tile">
            <div className="panel-tile__head">
              <h2>Brand assets</h2>
              <span className="panel-tile__count">{assets.length}</span>
            </div>
            <ul className="panel-list">
              {assets.slice(0, 4).map((a) => (
                <li key={a.id} className="panel-list__row">
                  <span className="panel-list__icon">{a.icon_text ?? "🎨"}</span>
                  <span className="panel-list__title">{a.title}</span>
                  <span className="pchip pchip--muted">{a.kind}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Raporty wpisy */}
        {show("report_entries") && reportEntries.length > 0 && (
          <section className="panel-tile panel-tile--wide">
            <div className="panel-tile__head">
              <h2>Raporty</h2>
              <span className="panel-tile__count">{reportEntries.length}</span>
            </div>
            <ul className="panel-reports">
              {reportEntries.slice(0, 3).map((r) => (
                <li key={r.id} className="panel-report">
                  <div className="panel-report__period">{r.period}</div>
                  <div className="panel-report__content">{r.content}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Wyślij pliki — CTA tile */}
        <section className="panel-tile panel-tile--cta">
          <div className="panel-tile__head">
            <h2>Wyślij pliki</h2>
          </div>
          <p className="panel-cta__text">Zdjęcia salonu, filmiki, materiały do pracy.</p>
          <Link href="/panel/upload" className="btn btn--primary btn--small">Otwórz upload →</Link>
        </section>

        {/* Czat — CTA tile */}
        <section className="panel-tile panel-tile--cta">
          <div className="panel-tile__head">
            <h2>Czat z opiekunami</h2>
          </div>
          <p className="panel-cta__text">Bez maili, bez czekania.</p>
          <Link href="/panel/chat" className="btn btn--primary btn--small">Otwórz czat →</Link>
        </section>
      </div>
    </main>
  );
}
