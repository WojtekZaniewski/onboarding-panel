"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storagePathFromFormFile } from "@/lib/storage";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/login");
  return supabase;
}

function revalidateClient(id: string) {
  revalidatePath(`/admin/klienci/${id}`);
  revalidatePath(`/panel`);
  revalidatePath(`/panel/dokumenty`);
  revalidatePath(`/panel/uslugi`);
}

// ── WIDOCZNOŚĆ SEKCJI ────────────────────────────────────────

export type SectionKey =
  | "services" | "documents" | "calendar" | "plan"
  | "assets" | "reports" | "notifications" | "opiekunowie"
  | "report_entries" | "current_work";

export async function setSectionVisible(
  clientId: string,
  section: SectionKey,
  visible: boolean,
) {
  const supabase = await requireAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("visible_sections")
    .eq("id", clientId)
    .maybeSingle();
  const current = (client?.visible_sections as Record<string, boolean> | null) ?? {};
  const next = { ...current, [section]: visible };
  await supabase.from("clients").update({ visible_sections: next }).eq("id", clientId);
  revalidateClient(clientId);
}

// ── IDENTYFIKACJA ────────────────────────────────────────────

export async function updateClientIdentity(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const payload = {
    salon_name: String(formData.get("salon_name") ?? "").trim(),
    display_first_name: String(formData.get("display_first_name") ?? "").trim(),
    display_short: String(formData.get("display_short") ?? "").trim(),
    avatar_initials: String(formData.get("avatar_initials") ?? "").trim().toUpperCase(),
  };
  if (!payload.salon_name || !payload.display_first_name) return;
  await supabase.from("clients").update(payload).eq("id", clientId);
  revalidateClient(clientId);
}

// ── USŁUGI ───────────────────────────────────────────────────

export async function setServiceStatus(clientId: string, serviceId: string, status: string) {
  const supabase = await requireAdmin();
  await supabase.from("services").update({ status }).eq("id", serviceId);
  revalidateClient(clientId);
}

export async function quickAddService(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const icon = String(formData.get("icon") ?? "").trim() || "✨";
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);
  await supabase.from("services").insert({
    client_id: clientId,
    icon,
    title,
    status: "w_robocie",
    display_order: count ?? 0,
  });
  revalidateClient(clientId);
}

// ── PLAN 30/90 ───────────────────────────────────────────────

export async function setPlanStatus(clientId: string, milestoneId: string, status: string) {
  const supabase = await requireAdmin();
  await supabase.from("plan_milestones").update({ badge_status: status }).eq("id", milestoneId);
  revalidateClient(clientId);
}

// ── POWIADOMIENIA ────────────────────────────────────────────

export async function toggleNotificationRead(clientId: string, notifId: string, isNew: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("notifications").update({ is_new: isNew }).eq("id", notifId);
  revalidateClient(clientId);
}

export async function quickAddNotification(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const meta = String(formData.get("meta") ?? "").trim() || null;
  if (!title) return;
  await supabase.from("notifications").insert({
    client_id: clientId,
    title,
    meta,
    is_new: true,
  });
  revalidateClient(clientId);
}

// ── KALENDARZ ────────────────────────────────────────────────

export async function quickAddCalendarItem(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const publish_date = String(formData.get("publish_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim() || null;
  if (!publish_date || !title) return;
  const { count } = await supabase
    .from("calendar_items")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);
  await supabase.from("calendar_items").insert({
    client_id: clientId,
    publish_date,
    title,
    channel,
    display_order: count ?? 0,
  });
  revalidateClient(clientId);
}

// ── RAPORTY (tekstowe wpisy) ─────────────────────────────────

export async function quickAddReportEntry(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const period = String(formData.get("period") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!period || !content) return;
  const { count } = await supabase
    .from("report_entries")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);
  await supabase.from("report_entries").insert({
    client_id: clientId,
    period,
    content,
    display_order: count ?? 0,
  });
  revalidateClient(clientId);
}

// ── NAD CZYM PRACUJEMY ───────────────────────────────────────

export async function quickAddCurrentWork(clientId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim() || null;
  if (!title) return;
  const { count } = await supabase
    .from("current_work")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);
  await supabase.from("current_work").insert({
    client_id: clientId,
    title,
    detail,
    display_order: count ?? 0,
  });
  revalidateClient(clientId);
}

// ── GENERIC DELETE ───────────────────────────────────────────

type TableName =
  | "services"
  | "documents"
  | "calendar_items"
  | "notifications"
  | "monthly_reports"
  | "brand_assets"
  | "plan_milestones"
  | "report_entries"
  | "current_work";

export async function deleteRow(table: TableName, id: string, clientId: string, filePath?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  if (filePath) {
    const bucket =
      table === "documents" ? "documents" :
      table === "monthly_reports" ? "reports" :
      table === "brand_assets" ? "brand-assets" : null;
    if (bucket) {
      await admin.storage.from(bucket).remove([filePath]);
    }
  }
  await admin.from(table).delete().eq("id", id);
  revalidateClient(clientId);
}

// ── UPLOADY (DROPZONE) ───────────────────────────────────────

function autoMeta(file: File): string {
  const sizeKb = file.size / 1024;
  const sizeStr = sizeKb >= 1024
    ? `${(sizeKb / 1024).toFixed(1)} MB`
    : `${Math.round(sizeKb)} KB`;
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "PLIK";
  const today = new Date().toLocaleDateString("pl-PL");
  return `${ext} · ${sizeStr} · ${today}`;
}

function iconFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["pdf"].includes(ext)) return "📄";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return "🖼️";
  if (["mp4", "mov", "webm"].includes(ext)) return "🎥";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  return "📎";
}

export async function uploadDocumentSimple(clientId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") ?? "umowy");
  if (!file || file.size === 0) return;

  const path = storagePathFromFormFile(clientId, file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from("documents")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  await admin.from("documents").insert({
    client_id: clientId,
    category,
    icon: iconFromName(file.name),
    name: file.name.replace(/\.[^.]+$/, ""),
    meta: autoMeta(file),
    file_path: path,
  });
  revalidateClient(clientId);
}

function periodFromName(name: string): string {
  const monthsMap: Record<string, string> = {
    sty: "Styczeń", lut: "Luty", mar: "Marzec", kwi: "Kwiecień",
    maj: "Maj", cze: "Czerwiec", lip: "Lipiec", sie: "Sierpień",
    wrz: "Wrzesień", paz: "Październik", paź: "Październik",
    lis: "Listopad", gru: "Grudzień",
  };
  const lower = name.toLowerCase();
  const yearMatch = lower.match(/20\d\d/);
  const year = yearMatch?.[0];
  for (const [key, label] of Object.entries(monthsMap)) {
    if (lower.includes(key)) return year ? `${label} ${year}` : label;
  }
  if (year) return year;
  return name.replace(/\.[^.]+$/, "");
}

export async function uploadReportSimple(clientId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const path = storagePathFromFormFile(clientId, file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("reports").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  await admin.from("monthly_reports").insert({
    client_id: clientId,
    period: periodFromName(file.name),
    file_path: path,
    published_at: new Date().toISOString().slice(0, 10),
  });
  revalidateClient(clientId);
}

const ASSET_TITLES: Record<string, string> = {
  logo: "Logo",
  palette: "Paleta kolorów",
  photos: "Zdjęcie salonu",
  templates: "Szablon postu",
};

export async function uploadBrandAssetSimple(clientId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;
  const kind = String(formData.get("kind") ?? "other");
  if (!file || file.size === 0) return;

  const path = storagePathFromFormFile(clientId, file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("brand-assets").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  const { count } = await admin
    .from("brand_assets")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  await admin.from("brand_assets").insert({
    client_id: clientId,
    kind,
    title: ASSET_TITLES[kind] ?? file.name.replace(/\.[^.]+$/, ""),
    meta: autoMeta(file),
    icon_text: iconFromName(file.name),
    file_path: path,
    display_order: count ?? 0,
  });
  revalidateClient(clientId);
}
