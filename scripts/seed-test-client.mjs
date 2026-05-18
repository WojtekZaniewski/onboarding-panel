// Seed test-client + opiekunów do Supabase.
// Uruchom: node scripts/seed-test-client.mjs
// Wymaga: .env.local z NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// Skrypt:
// 1. Tworzy w auth.users: admina, Wojtka, Kubę, Annę (jeśli jeszcze nie istnieją).
// 2. Ustawia role w profiles: admin/opiekun/opiekun/klient.
// 3. Tworzy 1 klienta "Salon Wenus" przypisanego do Anny.
// 4. Wstawia kompletną treść z legacy: pills, services, docs, calendar, notifs, plan, assets.
// 5. Tworzy chat_thread dla klienta.
//
// Po seedie: zaloguj się jako Anna na /login lub kontakt@beautyrise.pl jako admin.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Załaduj .env.local ręcznie (Node nie ma wbudowanego loadera)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(email, password, fullName, role) {
  // Sprawdź czy user istnieje
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`✓ User ${email} już istnieje (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`+ Utworzono user ${email} (${userId})`);
  }

  // Ustaw role + full_name w profiles (trigger już mógł stworzyć profil)
  const { error: upErr } = await supabase
    .from("profiles")
    .upsert({ id: userId, role, full_name: fullName, email });
  if (upErr) throw upErr;

  return userId;
}

async function main() {
  console.log("→ Tworzę userów…");
  const adminId = await ensureUser(
    "kontakt@beautyrise.pl",
    "BR-Admin-2026!",
    "BeautyRise HQ",
    "admin",
  );
  const wojtekId = await ensureUser(
    "wojtek@beautyrise.pl",
    "BR-Wojtek-2026!",
    "Wojciech Zaniewski",
    "opiekun",
  );
  const kubaId = await ensureUser(
    "jakub@beautyrise.pl",
    "BR-Kuba-2026!",
    "Jakub Eliasik",
    "opiekun",
  );
  const annaId = await ensureUser(
    "anna@salon-wenus.pl",
    "BR-Anna-2026!",
    "Anna Kowalska",
    "klient",
  );

  // Uzupełnij telefony/wa na opiekunach
  await supabase.from("profiles").update({
    initials: "WZ",
    phone: "+48 510 830 344",
    whatsapp_url: "https://wa.me/48510830344",
  }).eq("id", wojtekId);
  await supabase.from("profiles").update({
    initials: "JE",
    phone: "+48 534 187 109",
    whatsapp_url: "https://wa.me/48534187109",
  }).eq("id", kubaId);
  await supabase.from("profiles").update({
    initials: "AK",
  }).eq("id", annaId);

  console.log("→ Tworzę klienta Salon Wenus…");
  // sprawdź istniejącego klienta po owner
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_user_id", annaId)
    .maybeSingle();

  let clientId;
  if (existingClient) {
    clientId = existingClient.id;
    await supabase
      .from("clients")
      .update({
        salon_name: "Salon Wenus",
        display_first_name: "Anno",
        display_short: "Anna K.",
        avatar_initials: "AK",
        case_status: "aktywna",
      })
      .eq("id", clientId);
    console.log(`  ✓ Aktualizuję istniejący client ${clientId}`);
  } else {
    const { data: newClient, error: ce } = await supabase
      .from("clients")
      .insert({
        owner_user_id: annaId,
        salon_name: "Salon Wenus",
        display_first_name: "Anno",
        display_short: "Anna K.",
        avatar_initials: "AK",
        case_status: "aktywna",
      })
      .select()
      .single();
    if (ce) throw ce;
    clientId = newClient.id;
  }
  console.log(`  → client_id = ${clientId}`);

  // Przypisz opiekunów (Kuba pierwszy, Wojtek drugi — zgodnie z UI)
  await supabase.from("client_opiekun").delete().eq("client_id", clientId);
  await supabase.from("client_opiekun").insert([
    { client_id: clientId, opiekun_user_id: kubaId, display_order: 0 },
    { client_id: clientId, opiekun_user_id: wojtekId, display_order: 1 },
  ]);

  // Wyczyść poprzednią zawartość per-klient
  for (const table of [
    "status_pills",
    "services",
    "documents",
    "calendar_items",
    "notifications",
    "brand_assets",
    "plan_milestones",
  ]) {
    await supabase.from(table).delete().eq("client_id", clientId);
  }

  console.log("→ Wstawiam status pills…");
  await supabase.from("status_pills").insert([
    { client_id: clientId, label: "Sprawa aktywna", variant: "ok", display_order: 0 },
    { client_id: clientId, icon: "⚙️", label: "9 usług w toku", variant: "default", display_order: 1 },
    { client_id: clientId, icon: "📄", label: "Najnowszy raport: za 18 dni", variant: "default", display_order: 2 },
    { client_id: clientId, icon: "🔔", label: "3 nowe powiadomienia", variant: "accent", display_order: 3 },
  ]);

  console.log("→ Wstawiam usługi…");
  const services = [
    { icon: "🎯", title: "Kampanie reklamowe", body: "Start za 4 dni. Kreacje i grupa docelowa skonfigurowane.", status: "w_robocie" },
    { icon: "📱", title: "Content i social media", body: "Plan postów na pierwszy miesiąc gotowy. Zatwierdź jednym kliknięciem.", status: "czeka" },
    { icon: "🤖", title: "Automatyzacje CRM", body: "Przypomnienia SMS, follow-upy, win-back. Wdrażane etapami.", status: "w_robocie" },
    { icon: "💰", title: "Dofinansowania", body: "Analiza zakończona. Aplikujesz na 2 programy. Dokumenty w panelu.", status: "dostarczone" },
    { icon: "⚖️", title: "Ochrona prawna", body: "Polityki, regulaminy, RODO. Wdrożone i zgodne.", status: "dostarczone" },
    { icon: "📊", title: "Raporty & analityka", body: "Pierwszy raport po 30 dniach. Liczby, wnioski, plan.", status: "w_robocie" },
  ];
  await supabase.from("services").insert(
    services.map((s, i) => ({ ...s, client_id: clientId, display_order: i })),
  );

  console.log("→ Wstawiam dokumenty…");
  await supabase.from("documents").insert([
    { client_id: clientId, category: "umowy", icon: "📄", name: "Umowa o współpracę", meta: "PDF · 2,1 MB · podpisana 14.05.2026", file_path: "placeholder/umowa.pdf" },
    { client_id: clientId, category: "umowy", icon: "📄", name: "Aneks #1: zakres działań SoMe", meta: "PDF · 410 KB · podpisany 15.05.2026", file_path: "placeholder/aneks-1.pdf" },
    { client_id: clientId, category: "brief", icon: "📝", name: "Brief strategiczny", meta: "PDF · 840 KB · wypełniony 15.05.2026", file_path: "placeholder/brief.pdf" },
    { client_id: clientId, category: "brief", icon: "📝", name: "Brief kreatywny: pierwsza kampania", meta: "PDF · 620 KB · wersja robocza", file_path: "placeholder/brief-kreatywny.pdf" },
    { client_id: clientId, category: "rodo", icon: "🛡️", name: "Polityka prywatności salonu", meta: "PDF · 320 KB · zaktualizowana 16.05.2026", file_path: "placeholder/polityka.pdf" },
    { client_id: clientId, category: "rodo", icon: "🛡️", name: "Regulamin świadczenia usług", meta: "PDF · 280 KB · wersja 1.2", file_path: "placeholder/regulamin.pdf" },
    { client_id: clientId, category: "rodo", icon: "🛡️", name: "Klauzula RODO: formularz kontaktowy", meta: "PDF · 120 KB · wersja 2026", file_path: "placeholder/rodo.pdf" },
    { client_id: clientId, category: "faktury", icon: "💳", name: "Faktura FV/2026/05/0142", meta: "PDF · 110 KB · 15.05.2026 · opłacona", file_path: "placeholder/fv.pdf" },
  ]);

  console.log("→ Wstawiam kalendarz contentu…");
  await supabase.from("calendar_items").insert([
    { client_id: clientId, publish_date: "2026-05-17", title: 'Reel: „3 zabiegi, które pokocha każda klientka"', meta: "Instagram · 11:00 · gotowy do publikacji", channel: "📱 IG", display_order: 0 },
    { client_id: clientId, publish_date: "2026-05-18", title: "Kampania Meta: pakiet wiosenny", meta: "Facebook + Instagram · start 06:00 · 7 dni", channel: "🎯 Ads", display_order: 1 },
    { client_id: clientId, publish_date: "2026-05-20", title: "Story: pokaz zaplecza salonu", meta: "Instagram Stories · 14:30 · 4 ujęcia", channel: "📱 IG", display_order: 2 },
    { client_id: clientId, publish_date: "2026-05-22", title: "Post: opinia klientki + zdjęcie efektu", meta: "Facebook + Instagram · 18:00 · czeka na akceptację", channel: "📘 FB", display_order: 3 },
  ]);

  console.log("→ Wstawiam powiadomienia…");
  await supabase.from("notifications").insert([
    { client_id: clientId, title: "Plan postów na maj, czeka na Twoją akceptację", meta: "2 godziny temu · Content", is_new: true },
    { client_id: clientId, title: "Faktura FV/2026/05/0142 została opłacona", meta: "wczoraj, 14:22 · Finanse", is_new: true },
    { client_id: clientId, title: "Wojtek odpisał na Twoją wiadomość", meta: "wczoraj, 11:08 · Opiekun", is_new: true },
    { client_id: clientId, title: "CRM skonfigurowany i aktywny", meta: "3 dni temu · Usługi", is_new: false },
  ]);

  console.log("→ Wstawiam plan 30/90…");
  await supabase.from("plan_milestones").insert([
    { client_id: clientId, code: "D1",  title: "Fundament. Pierwsze 14 dni", body: "Audyt salonu online, ustawienie CRM, polityki i zgodność, dostępy. Zamykamy bałagan.", badge_status: "done",     display_order: 0 },
    { client_id: clientId, code: "D30", title: "Pierwszy miesiąc. Start kampanii", body: "Reklamy ruszają. Content idzie regularnie. Pierwszy raport zamyka miesiąc liczbami.",       badge_status: "active",   display_order: 1 },
    { client_id: clientId, code: "D60", title: "Drugi miesiąc. Optymalizacja", body: "Co działa, skalujemy. Co nie, wymieniamy. Decyzje na danych, nie na intuicji.",                  badge_status: "upcoming", display_order: 2 },
    { client_id: clientId, code: "D90", title: "Trzeci miesiąc. Skala", body: "Pełen system działa. Klientki rezerwują same. Wiesz dokładnie, ile kosztuje pozyskanie jednej.",         badge_status: "upcoming", display_order: 3 },
  ]);

  console.log("→ Wstawiam brand assets…");
  await supabase.from("brand_assets").insert([
    { client_id: clientId, kind: "logo",      title: "Logo",            meta: "SVG, PNG, ciemne i jasne · 6 plików", icon_text: "🅻",                                                                  display_order: 0 },
    { client_id: clientId, kind: "palette",   title: "Paleta kolorów",  meta: "HEX, RGB, CMYK · 5 kolorów marki",     icon_gradient: "linear-gradient(135deg, #ff751f, #c9a87a, #2a2a2a)",              display_order: 1 },
    { client_id: clientId, kind: "photos",    title: "Zdjęcia salonu",  meta: "48 plików RAW · sesja 04.06.2026",     icon_text: "📸",                                                                  display_order: 2 },
    { client_id: clientId, kind: "templates", title: "Szablony postów", meta: "Canva · 12 szablonów IG & FB",         icon_text: "🎨",                                                                  display_order: 3 },
  ]);

  console.log("→ Tworzę chat_thread…");
  const { data: existingThread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!existingThread) {
    await supabase.from("chat_threads").insert({ client_id: clientId });
  }

  console.log("\n✓ Seed zakończony.");
  console.log("\nDane testowe:");
  console.log("  Admin:    kontakt@beautyrise.pl  /  BR-Admin-2026!");
  console.log("  Opiekun:  wojtek@beautyrise.pl   /  BR-Wojtek-2026!");
  console.log("  Opiekun:  jakub@beautyrise.pl    /  BR-Kuba-2026!");
  console.log("  Klient:   anna@salon-wenus.pl    /  BR-Anna-2026!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
