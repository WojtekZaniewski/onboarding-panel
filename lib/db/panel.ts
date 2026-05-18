import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPreviewClientId } from "@/lib/preview";
import { getDerivedStatusPills } from "./derivedPills";
import type {
  Client,
  Profile,
  StatusPill,
  Service,
  Document,
  CalendarItem,
  Notification,
  MonthlyReport,
  BrandAsset,
  PlanMilestone,
  ClientTab,
  GlobalCopy,
  ReportEntry,
  CurrentWork,
} from "./types";

export type FullPanelData = {
  client: Client;
  caretakers: Profile[];
  statusPills: StatusPill[];
  services: Service[];
  documents: Document[];
  calendar: CalendarItem[];
  notifications: Notification[];
  reports: MonthlyReport[];
  assets: BrandAsset[];
  plan: PlanMilestone[];
  tabs: ClientTab[];
  global: Record<string, string>;
  reportEntries: ReportEntry[];
  currentWork: CurrentWork[];
};

export async function getCurrentClientForUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Tryb podglądu: admin może wejść w panel dowolnego klienta przez cookie.
  const previewId = await getPreviewClientId();
  if (previewId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "admin" || profile?.role === "opiekun") {
      // service_role: admin może mieć role policy uniemożliwiające widzenie clients bez przypisania
      const admin = createAdminClient();
      const { data: client } = await admin
        .from("clients")
        .select("*")
        .eq("id", previewId)
        .maybeSingle();
      if (client) return client as Client;
    }
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return (client as Client | null) ?? null;
}

export async function getFullPanelData(clientId: string): Promise<FullPanelData | null> {
  const supabase = await createClient();

  const [
    clientQ,
    careLinkQ,
    servicesQ,
    docsQ,
    calQ,
    notifsQ,
    reportsQ,
    assetsQ,
    planQ,
    globalQ,
    reportEntriesQ,
    currentWorkQ,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase
      .from("client_opiekun")
      .select("opiekun_user_id, display_order")
      .eq("client_id", clientId)
      .order("display_order"),
    supabase.from("services").select("*").eq("client_id", clientId).order("display_order"),
    supabase.from("documents").select("*").eq("client_id", clientId).order("uploaded_at", { ascending: false }),
    supabase.from("calendar_items").select("*").eq("client_id", clientId).order("publish_date"),
    supabase.from("notifications").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("monthly_reports").select("*").eq("client_id", clientId).order("period", { ascending: false }),
    supabase.from("brand_assets").select("*").eq("client_id", clientId).order("display_order"),
    supabase.from("plan_milestones").select("*").eq("client_id", clientId).order("display_order"),
    supabase.from("global_copy").select("*"),
    supabase.from("report_entries").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("current_work").select("*").eq("client_id", clientId).order("display_order"),
  ]);

  if (!clientQ.data) return null;

  const statusPills = await getDerivedStatusPills(
    supabase,
    clientId,
    (clientQ.data as Client).case_status,
  );

  let caretakers: Profile[] = [];
  const ids = (careLinkQ.data ?? []).map((r: { opiekun_user_id: string }) => r.opiekun_user_id);
  if (ids.length) {
    // Service_role żeby ominąć RLS na `profiles` — bezpieczne, bo i tak zwracamy tylko opiekunów przypisanych do widocznego klienta.
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("*").in("id", ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    caretakers = ((data as Profile[] | null) ?? []).slice().sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
  }

  const global: Record<string, string> = {};
  for (const row of (globalQ.data ?? []) as GlobalCopy[]) global[row.key] = row.value;

  return {
    client: clientQ.data as Client,
    caretakers,
    statusPills,
    services: (servicesQ.data ?? []) as Service[],
    documents: (docsQ.data ?? []) as Document[],
    calendar: (calQ.data ?? []) as CalendarItem[],
    notifications: (notifsQ.data ?? []) as Notification[],
    reports: (reportsQ.data ?? []) as MonthlyReport[],
    assets: (assetsQ.data ?? []) as BrandAsset[],
    plan: (planQ.data ?? []) as PlanMilestone[],
    tabs: [] as ClientTab[],
    global,
    reportEntries: (reportEntriesQ.data ?? []) as ReportEntry[],
    currentWork: (currentWorkQ.data ?? []) as CurrentWork[],
  };
}
