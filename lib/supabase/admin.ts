import { createClient as createSbClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client z service_role key.
 * NIGDY nie używaj w kodzie client-side. Ten klient pomija RLS.
 * Używaj wyłącznie w server actions po weryfikacji że caller to admin.
 */
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
