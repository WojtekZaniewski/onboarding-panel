import { createClient } from "@/lib/supabase/server";

/**
 * Generuje signed URL (1h) do pobrania pliku z private bucketu.
 * Zwraca null gdy nie udało się wygenerować.
 */
export async function signedUrl(bucket: string, path: string, expiresInSec = 3600) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  return data?.signedUrl ?? null;
}

export function storagePathFromFormFile(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const ts = Date.now();
  return `${prefix}/${ts}-${safeName}`;
}
