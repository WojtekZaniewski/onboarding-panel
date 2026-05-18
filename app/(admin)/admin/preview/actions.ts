"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPreviewClientId, clearPreviewClientId } from "@/lib/preview";

async function requireAdminOrOpiekun() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "opiekun")) redirect("/login");
  return profile.role;
}

export async function enterPreview(clientId: string) {
  await requireAdminOrOpiekun();
  await setPreviewClientId(clientId);
  redirect("/panel");
}

export async function exitPreview() {
  await clearPreviewClientId();
  redirect("/admin");
}
