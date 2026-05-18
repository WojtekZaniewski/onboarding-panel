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

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  let out = "";
  out += upper[Math.floor(Math.random() * upper.length)];
  out += lower[Math.floor(Math.random() * lower.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 0; i < 9; i++) out += all[Math.floor(Math.random() * all.length)];
  return out
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function createNewClient(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const salonName = String(formData.get("salon_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const heroName = String(formData.get("display_first_name") ?? "").trim();

  if (!fullName || !salonName || !email) {
    redirect("/admin/klienci/nowy?error=Wype%C5%82nij%20wszystkie%20pola");
  }

  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  const displayFirstName = heroName || `${firstName}.`;
  const lastInitial = fullName.split(/\s+/).slice(1)[0]?.[0];
  const displayShort = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
  const avatarInitials = autoInitials(fullName);
  const password = generatePassword();

  // 1. Auth user
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

  await admin.from("profiles").upsert({
    id: userId,
    role: "klient",
    full_name: fullName,
    initials: avatarInitials,
    email,
  });

  // 2. Clients row
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

  // 3. Przypisz wszystkich opiekunów (jak są)
  const { data: opiekuns } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "opiekun");
  if (opiekuns?.length) {
    await admin.from("client_opiekun").insert(
      opiekuns.map((o, i) => ({
        client_id: clientId,
        opiekun_user_id: o.id,
        display_order: i,
      })),
    );
  }

  // 4. Chat thread
  await admin.from("chat_threads").insert({ client_id: clientId });

  // 5. Default plan + powitalne powiadomienie
  await admin.from("plan_milestones").insert([
    { client_id: clientId, code: "D1",  title: "Fundament. Pierwsze 14 dni",      body: "Audyt salonu online, ustawienie CRM, polityki i zgodność, dostępy.",       badge_status: "active",   display_order: 0 },
    { client_id: clientId, code: "D30", title: "Pierwszy miesiąc. Start kampanii", body: "Reklamy ruszają. Content idzie regularnie. Pierwszy raport zamyka miesiąc.", badge_status: "upcoming", display_order: 1 },
    { client_id: clientId, code: "D60", title: "Drugi miesiąc. Optymalizacja",     body: "Co działa, skalujemy. Co nie, wymieniamy.",                                  badge_status: "upcoming", display_order: 2 },
    { client_id: clientId, code: "D90", title: "Trzeci miesiąc. Skala",            body: "Pełen system działa. Klientki rezerwują same.",                              badge_status: "upcoming", display_order: 3 },
  ]);
  await admin.from("notifications").insert({
    client_id: clientId,
    title: "Witaj w panelu BeautyRise",
    meta: `Onboarding · ${new Date().toLocaleDateString("pl-PL")}`,
    is_new: true,
  });

  revalidatePath("/admin/klienci");
  redirect(`/admin/klienci/${clientId}?just_created=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}`);
}
