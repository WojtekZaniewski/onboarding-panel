import { cookies } from "next/headers";

const COOKIE = "br_preview_client_id";

export async function getPreviewClientId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function setPreviewClientId(clientId: string) {
  const c = await cookies();
  c.set(COOKIE, clientId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
}

export async function clearPreviewClientId() {
  const c = await cookies();
  c.delete(COOKIE);
}
