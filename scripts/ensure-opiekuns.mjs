// Tworzy/aktualizuje stałych opiekunów: Jakub Eliasik + Wojciech Zaniewski.
// Przypisuje ich do wszystkich istniejących klientów.
// Logika `createNewClient` automatycznie przypisze ich do każdego nowego klienta.
//
// Uruchom: node scripts/ensure-opiekuns.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const OPIEKUNS = [
  {
    email: "jakub@beautyrise.pl",
    password: "BR-Kuba-2026!",
    full_name: "Jakub Eliasik",
    initials: "JE",
    phone: "+48 534 187 109",
    whatsapp_url: "https://wa.me/48534187109",
    display_order: 0,
  },
  {
    email: "wojtek@beautyrise.pl",
    password: "BR-Wojtek-2026!",
    full_name: "Wojciech Zaniewski",
    initials: "WZ",
    phone: "+48 510 830 344",
    whatsapp_url: "https://wa.me/48510830344",
    display_order: 1,
  },
];

async function ensureUser(o) {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === o.email);
  let userId;
  if (existing) {
    userId = existing.id;
    console.log(`✓ ${o.email} już istnieje (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: o.email,
      password: o.password,
      email_confirm: true,
      user_metadata: { full_name: o.full_name, role: "opiekun" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`+ Utworzono ${o.email} (${userId})`);
  }

  // upsert do profiles
  const { error: upErr } = await supabase.from("profiles").upsert({
    id: userId,
    role: "opiekun",
    full_name: o.full_name,
    initials: o.initials,
    phone: o.phone,
    email: o.email,
    whatsapp_url: o.whatsapp_url,
  });
  if (upErr) throw upErr;
  return userId;
}

async function main() {
  console.log("→ Zapewniam istnienie 2 opiekunów…");
  const ids = [];
  for (const o of OPIEKUNS) {
    ids.push({ id: await ensureUser(o), display_order: o.display_order });
  }

  console.log("\n→ Przypisuję do wszystkich istniejących klientów…");
  const { data: clients } = await supabase.from("clients").select("id, salon_name");
  if (!clients?.length) {
    console.log("  (brak klientów)");
  }
  for (const c of clients ?? []) {
    for (const o of ids) {
      const { error } = await supabase
        .from("client_opiekun")
        .upsert(
          { client_id: c.id, opiekun_user_id: o.id, display_order: o.display_order },
          { onConflict: "client_id,opiekun_user_id" },
        );
      if (error) console.error(`  ✗ ${c.salon_name} ← ${o.id}: ${error.message}`);
    }
    console.log(`  ✓ ${c.salon_name}`);
  }

  console.log("\n✓ Gotowe.");
  console.log("\nKonta opiekunów (logowanie):");
  for (const o of OPIEKUNS) {
    console.log(`  ${o.full_name.padEnd(22)} ${o.email}  /  ${o.password}`);
  }
  console.log("\nKażdy nowy klient utworzony przez /admin/klienci/nowy będzie miał ich przypisanych automatycznie.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
