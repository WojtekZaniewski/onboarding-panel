"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

function autoInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function createNewClient(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const salonName = String(formData.get("salon_name") ?? "").trim();
  const displayFirstName = String(formData.get("display_first_name") ?? "").trim();
  const displayShort = String(formData.get("display_short") ?? "").trim() || fullName;
  const avatarInitials = String(formData.get("avatar_initials") ?? "").trim().toUpperCase() || autoInitials(fullName || displayShort);
  const opiekunIds = formData.getAll("opiekun_ids").map(String).filter(Boolean);
  const withSeed = formData.get("seed_defaults") === "on";

  if (!email || !password || !fullName || !salonName || !displayFirstName) {
    redirect("/admin/klienci/nowy?error=Wype%C5%82nij%20wszystkie%20wymagane%20pola");
  }

  // 1. Utwórz auth user
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "klient" },
  });
  if (authErr) {
    redirect(`/admin/klienci/nowy?error=${encodeURIComponent(authErr.message)}`);
  }
  const userId = created!.user.id;

  // 2. Upsert profile (trigger już mógł stworzyć, podmieniamy bezpiecznie)
  await admin.from("profiles").upsert({
    id: userId,
    role: "klient",
    full_name: fullName,
    initials: avatarInitials,
    email,
  });

  // 3. Insert clients
  const { data: clientRow, error: ce } = await admin
    .from("clients")
    .insert({
      owner_user_id: userId,
      salon_name: salonName,
      display_first_name: displayFirstName,
      display_short: displayShort,
      avatar_initials: avatarInitials,
      case_status: "aktywna",
    })
    .select()
    .single();
  if (ce) {
    redirect(`/admin/klienci/nowy?error=${encodeURIComponent("clients: " + ce.message)}`);
  }
  const clientId = clientRow!.id;

  // 4. Przypisz opiekunów
  if (opiekunIds.length) {
    await admin.from("client_opiekun").insert(
      opiekunIds.map((opiekun_user_id, i) => ({
        client_id: clientId,
        opiekun_user_id,
        display_order: i,
      })),
    );
  }

  // 5. Stwórz chat thread
  await admin.from("chat_threads").insert({ client_id: clientId });

  // 6. Opcjonalny seed startowych sekcji
  if (withSeed) {
    await admin.from("status_pills").insert([
      { client_id: clientId, label: "Sprawa aktywna", variant: "ok", display_order: 0 },
      { client_id: clientId, icon: "⚙️", label: "Onboarding w toku", variant: "default", display_order: 1 },
    ]);
    await admin.from("plan_milestones").insert([
      { client_id: clientId, code: "D1", title: "Fundament. Pierwsze 14 dni", body: "Audyt salonu online, ustawienie CRM, polityki i zgodność, dostępy.", badge_status: "active", display_order: 0 },
      { client_id: clientId, code: "D30", title: "Pierwszy miesiąc. Start kampanii", body: "Reklamy ruszają. Content idzie regularnie. Pierwszy raport zamyka miesiąc liczbami.", badge_status: "upcoming", display_order: 1 },
      { client_id: clientId, code: "D60", title: "Drugi miesiąc. Optymalizacja", body: "Co działa, skalujemy. Co nie, wymieniamy.", badge_status: "upcoming", display_order: 2 },
      { client_id: clientId, code: "D90", title: "Trzeci miesiąc. Skala", body: "Pełen system działa. Klientki rezerwują same.", badge_status: "upcoming", display_order: 3 },
    ]);
    await admin.from("notifications").insert({
      client_id: clientId,
      title: "Witaj w panelu BeautyRise",
      meta: `Onboarding · ${new Date().toLocaleDateString("pl-PL")}`,
      is_new: true,
    });
  }

  revalidatePath("/admin/klienci");
  redirect(`/admin/klienci/${clientId}`);
}
