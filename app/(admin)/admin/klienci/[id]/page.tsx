import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusToggle3, type ToggleOption } from "@/components/admin/StatusToggle3";
import { Dropzone } from "@/components/admin/Dropzone";
import { Chip } from "@/components/admin/Chip";
import { QuickAdd } from "@/components/admin/QuickAdd";
import { Switch } from "@/components/admin/Switch";
import { enterPreview } from "@/app/(admin)/admin/preview/actions";
import {
  updateClientIdentity,
  setServiceStatus,
  quickAddService,
  setPlanStatus,
  toggleNotificationRead,
  quickAddNotification,
  quickAddCalendarItem,
  quickAddReportEntry,
  quickAddCurrentWork,
  uploadDocumentSimple,
  uploadReportSimple,
  uploadBrandAssetSimple,
  setSectionVisible,
  type SectionKey,
  deleteRow,
} from "./actions";

const SECTION_LABELS: { key: SectionKey; label: string }[] = [
  { key: "services", label: "Status usług" },
  { key: "current_work", label: "Nad czym pracujemy" },
  { key: "documents", label: "Dokumenty" },
  { key: "calendar", label: "Kalendarz contentu" },
  { key: "plan", label: "Plan 30 / 90" },
  { key: "report_entries", label: "Raporty (wpisy)" },
  { key: "assets", label: "Brand assets" },
  { key: "reports", label: "Raporty (PDF)" },
  { key: "notifications", label: "Powiadomienia" },
  { key: "opiekunowie", label: "Opiekunowie (sekcja 03)" },
];

const SERVICE_OPTIONS: ToggleOption[] = [
  { value: "w_robocie", label: "W robocie", variant: "active" },
  { value: "czeka", label: "Czeka na Ciebie", variant: "warn" },
  { value: "dostarczone", label: "Dostarczone", variant: "done" },
];

const PLAN_OPTIONS: ToggleOption[] = [
  { value: "done", label: "Zrobione", variant: "ok" },
  { value: "active", label: "W toku", variant: "active" },
  { value: "upcoming", label: "Wkrótce", variant: "default" },
];

const PL_MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${PL_MONTHS[d.getMonth()]}`;
}

export default async function ClientEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_created?: string; email?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const [
    clientQ,
    servicesQ,
    docsQ,
    reportsQ,
    assetsQ,
    planQ,
    notifsQ,
    calQ,
    reportEntriesQ,
    currentWorkQ,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("services").select("*").eq("client_id", id).order("display_order"),
    supabase.from("documents").select("*").eq("client_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("monthly_reports").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("brand_assets").select("*").eq("client_id", id).order("display_order"),
    supabase.from("plan_milestones").select("*").eq("client_id", id).order("display_order"),
    supabase.from("notifications").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("calendar_items").select("*").eq("client_id", id).order("publish_date"),
    supabase.from("report_entries").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("current_work").select("*").eq("client_id", id).order("display_order"),
  ]);

  if (!clientQ.data) notFound();
  const client = clientQ.data;
  const visibility = (client.visible_sections ?? {}) as Record<SectionKey, boolean>;

  const services = servicesQ.data ?? [];
  const docs = docsQ.data ?? [];
  const reports = reportsQ.data ?? [];
  const assets = assetsQ.data ?? [];
  const plan = planQ.data ?? [];
  const notifs = notifsQ.data ?? [];
  const calendar = calQ.data ?? [];
  const reportEntries = reportEntriesQ.data ?? [];
  const currentWork = currentWorkQ.data ?? [];

  return (
    <div className="admin-grid">
      {sp.just_created && (
        <section className="admin-tile admin-tile--span2 admin-tile--success">
          <div className="admin-tile__head">
            <h2>✓ Klient utworzony</h2>
          </div>
          <p className="admin-success__text">
            Przekaż klientce dane logowania (zobaczysz je tylko teraz):
          </p>
          <div className="admin-credential">
            <div className="admin-credential__row">
              <span className="admin-credential__label">E-mail</span>
              <code className="admin-credential__value">{sp.email}</code>
            </div>
            <div className="admin-credential__row">
              <span className="admin-credential__label">Hasło</span>
              <code className="admin-credential__value admin-credential__value--password">
                {sp.just_created}
              </code>
            </div>
          </div>
          <p className="admin-success__hint">
            Po pierwszym zalogowaniu klientka może zmienić hasło. Jeśli stracicie te dane, możesz wygenerować nowe w Supabase Auth.
          </p>
        </section>
      )}

      {/* Kafelek: Identyfikacja */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>{client.salon_name}</h2>
          <form action={enterPreview.bind(null, id)}>
            <button type="submit" className="btn btn--primary btn--small">
              👁 Otwórz panel klienta
            </button>
          </form>
        </div>
        <form action={updateClientIdentity.bind(null, id)} className="admin-identity">
          <label className="admin-field">
            <span>Nazwa salonu</span>
            <input name="salon_name" defaultValue={client.salon_name} required />
          </label>
          <label className="admin-field">
            <span>Imię klientki (hero)</span>
            <input name="display_first_name" defaultValue={client.display_first_name} required />
          </label>
          <label className="admin-field">
            <span>Skrót w navbarze</span>
            <input name="display_short" defaultValue={client.display_short} required />
          </label>
          <label className="admin-field admin-field--narrow">
            <span>Awatar</span>
            <input name="avatar_initials" defaultValue={client.avatar_initials} maxLength={3} />
          </label>
          <button type="submit" className="btn btn--primary btn--small admin-identity__submit">Zapisz dane</button>
        </form>
      </section>

      {/* Kafelek: Widoczność sekcji */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Widoczność sekcji</h2>
          <span className="admin-tile__hint">Master-switche per klient. OFF = sekcja znika z panelu.</span>
        </div>
        <div className="visibility-grid">
          {SECTION_LABELS.map((s) => (
            <Switch
              key={s.key}
              label={s.label}
              checked={visibility[s.key] ?? true}
              onToggle={async (next) => {
                "use server";
                await setSectionVisible(id, s.key, next);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Status usług */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Status usług</h2>
          <span className="admin-tile__hint">{services.length} pozycji</span>
        </div>
        <div className="admin-toggle-list">
          {services.map((s) => (
            <div key={s.id} className="admin-toggle-row">
              <div className="admin-toggle-row__label">
                <span className="admin-toggle-row__icon">{s.icon ?? "•"}</span>
                <span>{s.title}</span>
              </div>
              <StatusToggle3
                value={s.status}
                options={SERVICE_OPTIONS}
                onSet={async (next) => {
                  "use server";
                  await setServiceStatus(id, s.id, next);
                }}
              />
              <form
                action={async () => {
                  "use server";
                  await deleteRow("services", s.id, id);
                }}
              >
                <button className="admin-toggle-row__del" aria-label="Usuń">×</button>
              </form>
            </div>
          ))}
          {services.length === 0 && <p className="admin-empty">Brak usług. Dodaj pierwszą poniżej.</p>}
        </div>
        <QuickAdd action={quickAddService.bind(null, id)} submitLabel="Dodaj usługę">
          <input name="icon" placeholder="🎯" maxLength={3} className="quick-add__narrow" />
          <input name="title" placeholder="Tytuł usługi (np. Kampanie reklamowe)" required />
        </QuickAdd>
      </section>

      {/* Kafelek: Nad czym pracujemy */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Nad czym pracujemy</h2>
          <span className="admin-tile__hint">{currentWork.length} wpisów</span>
        </div>
        <QuickAdd action={quickAddCurrentWork.bind(null, id)} submitLabel="Dodaj">
          <input name="title" placeholder="Co robimy (np. Sesja zdjęciowa w piątek)" required />
          <input name="detail" placeholder="Szczegóły (opcjonalne)" />
        </QuickAdd>
        <div className="chip-list">
          {currentWork.map((w) => (
            <Chip
              key={w.id}
              icon="⚡"
              title={w.title}
              meta={w.detail ?? ""}
              onDelete={async () => {
                "use server";
                await deleteRow("current_work", w.id, id);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Raporty (wpisy tekstowe) */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Raporty (wpisy)</h2>
          <span className="admin-tile__hint">{reportEntries.length} wpisów</span>
        </div>
        <QuickAdd action={quickAddReportEntry.bind(null, id)} submitLabel="Dodaj wpis">
          <input name="period" placeholder="Okres (np. Maj 2026)" required className="quick-add__narrow" />
          <input name="content" placeholder="Treść raportu — co zrobiliśmy, efekty, plan na dalej" required />
        </QuickAdd>
        <div className="chip-list">
          {reportEntries.map((r) => (
            <Chip
              key={r.id}
              icon="📋"
              title={r.period}
              meta={r.content}
              onDelete={async () => {
                "use server";
                await deleteRow("report_entries", r.id, id);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Dokumenty */}
      <section className="admin-tile">
        <div className="admin-tile__head">
          <h2>Dokumenty</h2>
          <span className="admin-tile__hint">{docs.length}</span>
        </div>
        <Dropzone
          action={uploadDocumentSimple.bind(null, id)}
          accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
          hint="PDF, Word, Excel, obrazy"
          extraFields={
            <select name="category" defaultValue="umowy" className="dropzone__select">
              <option value="umowy">Umowy</option>
              <option value="brief">Briefy</option>
              <option value="rodo">RODO &amp; regulaminy</option>
              <option value="faktury">Faktury</option>
            </select>
          }
        />
        <div className="chip-list">
          {docs.map((d) => (
            <Chip
              key={d.id}
              icon={d.icon}
              title={d.name}
              meta={d.meta ?? ""}
              badge={d.category}
              onDelete={async () => {
                "use server";
                await deleteRow("documents", d.id, id, d.file_path);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Raporty */}
      <section className="admin-tile">
        <div className="admin-tile__head">
          <h2>Raporty miesięczne</h2>
          <span className="admin-tile__hint">{reports.length}</span>
        </div>
        <Dropzone
          action={uploadReportSimple.bind(null, id)}
          accept="application/pdf"
          hint={'PDF · period z nazwy pliku (np. „raport-maj-2026.pdf")'}
        />
        <div className="chip-list">
          {reports.map((r) => (
            <Chip
              key={r.id}
              icon="📊"
              title={r.period}
              meta={r.published_at ?? "—"}
              onDelete={async () => {
                "use server";
                await deleteRow("monthly_reports", r.id, id, r.file_path ?? undefined);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Brand assets */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Brand assets</h2>
          <span className="admin-tile__hint">{assets.length}</span>
        </div>
        <Dropzone
          action={uploadBrandAssetSimple.bind(null, id)}
          accept="image/*,application/pdf,.svg,.zip"
          hint="Logo, zdjęcia, paleta, szablony"
          extraFields={
            <select name="kind" defaultValue="photos" className="dropzone__select">
              <option value="logo">Logo</option>
              <option value="photos">Zdjęcia</option>
              <option value="palette">Paleta</option>
              <option value="templates">Szablony</option>
              <option value="other">Inne</option>
            </select>
          }
        />
        <div className="chip-list chip-list--grid">
          {assets.map((a) => (
            <Chip
              key={a.id}
              icon={a.icon_text ?? "🎨"}
              title={a.title}
              meta={a.meta ?? ""}
              badge={a.kind}
              onDelete={async () => {
                "use server";
                await deleteRow("brand_assets", a.id, id, a.file_path ?? undefined);
              }}
            />
          ))}
        </div>
      </section>

      {/* Kafelek: Plan 30/90 */}
      <section className="admin-tile admin-tile--span2">
        <div className="admin-tile__head">
          <h2>Plan 30 / 90</h2>
          <span className="admin-tile__hint">{plan.length} milestone'ów</span>
        </div>
        <div className="admin-toggle-list">
          {plan.map((m) => (
            <div key={m.id} className="admin-toggle-row">
              <div className="admin-toggle-row__label">
                <span className="admin-toggle-row__code">{m.code}</span>
                <span>{m.title}</span>
              </div>
              <StatusToggle3
                value={m.badge_status ?? "upcoming"}
                options={PLAN_OPTIONS}
                onSet={async (next) => {
                  "use server";
                  await setPlanStatus(id, m.id, next);
                }}
              />
            </div>
          ))}
          {plan.length === 0 && (
            <p className="admin-empty">
              Brak milestone'ów (utwórz nowego klienta z seedem domyślnym lub dodaj ręcznie w SQL).
            </p>
          )}
        </div>
      </section>

      {/* Kafelek: Powiadomienia */}
      <section className="admin-tile">
        <div className="admin-tile__head">
          <h2>Powiadomienia</h2>
          <span className="admin-tile__hint">{notifs.filter((n) => n.is_new).length} nowych</span>
        </div>
        <QuickAdd action={quickAddNotification.bind(null, id)} submitLabel="Wyślij">
          <input name="title" placeholder="Tytuł (np. Plan postów czeka)" required />
          <input name="meta" placeholder="Meta (opcjonalna)" />
        </QuickAdd>
        <div className="chip-list">
          {notifs.map((n) => (
            <Chip
              key={n.id}
              icon={n.is_new ? "🔔" : "✓"}
              title={n.title}
              meta={n.meta ?? ""}
              highlight={n.is_new}
              onDelete={async () => {
                "use server";
                await deleteRow("notifications", n.id, id);
              }}
            >
              <Switch
                size="sm"
                label={n.is_new ? "Nowe" : "Przeczytane"}
                checked={n.is_new}
                onToggle={async (next) => {
                  "use server";
                  await toggleNotificationRead(id, n.id, next);
                }}
              />
            </Chip>
          ))}
        </div>
      </section>

      {/* Kafelek: Kalendarz */}
      <section className="admin-tile">
        <div className="admin-tile__head">
          <h2>Kalendarz contentu</h2>
          <span className="admin-tile__hint">{calendar.length}</span>
        </div>
        <QuickAdd action={quickAddCalendarItem.bind(null, id)} submitLabel="Dodaj wpis">
          <input name="publish_date" type="date" required className="quick-add__narrow" />
          <input name="title" placeholder="Tytuł (np. Reel z zabiegu)" required />
          <select name="channel" defaultValue="📱 IG" className="quick-add__narrow">
            <option value="📱 IG">📱 IG</option>
            <option value="📘 FB">📘 FB</option>
            <option value="🎯 Ads">🎯 Ads</option>
            <option value="📧 Mail">📧 Mail</option>
            <option value="🎵 TikTok">🎵 TikTok</option>
          </select>
        </QuickAdd>
        <div className="chip-list">
          {calendar.map((c) => (
            <Chip
              key={c.id}
              icon={c.channel ?? "📅"}
              title={c.title}
              meta={fmtDate(c.publish_date)}
              onDelete={async () => {
                "use server";
                await deleteRow("calendar_items", c.id, id);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
