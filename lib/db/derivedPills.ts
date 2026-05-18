import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatusPill } from "./types";

/**
 * Wylicza 4 pille statusu na hero panelu klienta z danych:
 * 1. Sprawa aktywna (variant ok)
 * 2. Usługi w toku (count services where status='w_robocie')
 * 3. Najbliższy raport (najbliższy monthly_reports.published_at w przyszłości)
 * 4. Nowe powiadomienia (count notifications where is_new=true), variant accent jeśli >0
 */
export async function getDerivedStatusPills(
  supabase: SupabaseClient,
  clientId: string,
  caseStatus: string | null,
): Promise<StatusPill[]> {
  const [servicesQ, reportsQ, notifsQ] = await Promise.all([
    supabase
      .from("services")
      .select("status", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "w_robocie"),
    supabase
      .from("monthly_reports")
      .select("period, published_at")
      .eq("client_id", clientId)
      .not("published_at", "is", null)
      .gte("published_at", new Date().toISOString().slice(0, 10))
      .order("published_at", { ascending: true })
      .limit(1),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_new", true),
  ]);

  const inWorkCount = servicesQ.count ?? 0;
  const newNotifsCount = notifsQ.count ?? 0;
  const nextReport = (reportsQ.data ?? [])[0];

  const pills: StatusPill[] = [];

  pills.push({
    id: "derived-active",
    client_id: clientId,
    icon: null,
    label: caseStatus === "aktywna" ? "Sprawa aktywna" : `Sprawa: ${caseStatus ?? "—"}`,
    variant: "ok",
    display_order: 0,
  });

  if (inWorkCount > 0) {
    pills.push({
      id: "derived-services",
      client_id: clientId,
      icon: "⚙️",
      label: `${inWorkCount} ${plUslugi(inWorkCount)} w toku`,
      variant: "default",
      display_order: 1,
    });
  }

  if (nextReport?.published_at) {
    const days = Math.max(
      0,
      Math.ceil(
        (new Date(nextReport.published_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    pills.push({
      id: "derived-report",
      client_id: clientId,
      icon: "📄",
      label: days === 0 ? "Najnowszy raport: dziś" : `Najnowszy raport: za ${days} ${plDni(days)}`,
      variant: "default",
      display_order: 2,
    });
  }

  if (newNotifsCount > 0) {
    pills.push({
      id: "derived-notifs",
      client_id: clientId,
      icon: "🔔",
      label: `${newNotifsCount} ${plPowiadomienia(newNotifsCount)}`,
      variant: "accent",
      display_order: 3,
    });
  }

  return pills;
}

function plUslugi(n: number) {
  if (n === 1) return "usługa";
  if (n >= 2 && n <= 4) return "usługi";
  return "usług";
}

function plDni(n: number) {
  if (n === 1) return "dzień";
  if (n >= 2 && n <= 4) return "dni";
  return "dni";
}

function plPowiadomienia(n: number) {
  if (n === 1) return "nowe powiadomienie";
  if (n >= 2 && n <= 4) return "nowe powiadomienia";
  return "nowych powiadomień";
}
