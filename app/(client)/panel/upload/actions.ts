"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storagePathFromFormFile } from "@/lib/storage";

export async function uploadClientFile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!client) redirect("/login");

  // Storage upload przez service_role żeby ominąć potencjalny brak storage RLS policy.
  // Wpis do `client_uploads` idzie przez user session — RLS pozwala (own client).
  const admin = createAdminClient();

  const files = formData.getAll("files") as File[];
  const caption = String(formData.get("caption") ?? "");
  const kind = String(formData.get("kind") ?? "zdjecie");

  for (const file of files) {
    if (!file || file.size === 0) continue;
    const path = storagePathFromFormFile(client.id, file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("client-uploads")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    await supabase.from("client_uploads").insert({
      client_id: client.id,
      uploaded_by: user.id,
      kind,
      caption,
      file_path: path,
      status: "nowe",
    });
  }

  revalidatePath("/panel/upload");
}
