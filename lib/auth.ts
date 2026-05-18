import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "opiekun" | "klient";

export type CachedProfile = {
  id: string;
  role: Role;
  full_name: string;
  initials: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_url: string | null;
};

/** Cached per request — wszystkie wywołania w tym samym RSC tree zwracają ten sam wynik. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<CachedProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, initials, phone, email, whatsapp_url")
    .eq("id", user.id)
    .maybeSingle();
  return (data as CachedProfile | null) ?? null;
});

/** Wymusza rolę. Redirect na /login (brak sesji) lub na własny panel (zła rola). */
export async function requireRole(roles: Role[]): Promise<CachedProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!roles.includes(profile.role)) {
    redirect(
      profile.role === "admin" ? "/admin" :
      profile.role === "opiekun" ? "/opiekun" : "/panel",
    );
  }
  return profile;
}
