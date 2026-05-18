// Usuwa WSZYSTKICH userów (auth.users) oprócz kontakt@beautyrise.pl.
// Cascade usuwa profiles, clients (FK), client_opiekun, services, dokumenty,
// kalendarz, powiadomienia, plan, assets, raporty, report_entries, current_work, chat.
//
// Uruchom: node scripts/cleanup-all-except-admin.mjs

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

const KEEP_EMAIL = "kontakt@beautyrise.pl";

const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Łącznie userów: ${users.length}`);
let removed = 0;
let kept = 0;

for (const u of users) {
  if (u.email === KEEP_EMAIL) {
    console.log(`✓ Zachowuję ${u.email}`);
    kept++;
    continue;
  }
  const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
  if (delErr) {
    console.error(`✗ ${u.email}: ${delErr.message}`);
  } else {
    console.log(`× Usunięto ${u.email}`);
    removed++;
  }
}

// Dla pewności wyczyść orphan rekordy (clients bez owner_user_id, profiles bez auth)
const { data: orphanClients } = await supabase
  .from("clients")
  .select("id, salon_name")
  .is("owner_user_id", null);
if (orphanClients?.length) {
  console.log(`\nUsuwam ${orphanClients.length} sierot klientów…`);
  await supabase.from("clients").delete().is("owner_user_id", null);
}

console.log(`\n✓ Gotowe. Usuniętych: ${removed}, zachowanych: ${kept}.`);
console.log(`\nZostał tylko admin: ${KEEP_EMAIL}`);
console.log(`Hasło: BR-Admin-2026!`);
