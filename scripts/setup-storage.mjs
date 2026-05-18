// Tworzy potrzebne buckety w Supabase Storage.
// Uruchom: node scripts/setup-storage.mjs

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

const BUCKETS = [
  { name: "documents",      public: false },
  { name: "reports",        public: false },
  { name: "brand-assets",   public: false },
  { name: "client-uploads", public: false },
  { name: "chat-attachments", public: false },
];

for (const b of BUCKETS) {
  const { data: list } = await supabase.storage.listBuckets();
  if (list?.some((x) => x.name === b.name)) {
    console.log(`✓ bucket ${b.name} już istnieje`);
    continue;
  }
  const { error } = await supabase.storage.createBucket(b.name, {
    public: b.public,
    fileSizeLimit: 50 * 1024 * 1024,
  });
  if (error) {
    console.error(`✗ ${b.name}:`, error.message);
  } else {
    console.log(`+ utworzono ${b.name}`);
  }
}
console.log("\n✓ Storage gotowy.");
