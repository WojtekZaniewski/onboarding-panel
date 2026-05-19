import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function UploadsAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: uploads } = await supabase
    .from("client_uploads")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  if (!uploads) notFound();

  // Signed URLs przez service_role (bypass storage RLS, bezpieczne bo admin route)
  const admin = createAdminClient();
  const urls = await Promise.all(
    uploads.map(async (u) => {
      const { data } = await admin.storage
        .from("client-uploads")
        .createSignedUrl(u.file_path, 60 * 60);
      return data?.signedUrl ?? null;
    }),
  );

  return (
    <section className="admin-form-section">
      <h2>Uploady od klienta ({uploads.length})</h2>
      <p className="admin-hint">Zdjęcia, filmiki, pliki przysyłane przez klienta. Klikaj „Otwórz” żeby pobrać/zobaczyć.</p>
      {uploads.length === 0 ? (
        <p className="admin-hint">Brak uploadów. Klient nic jeszcze nie wysłał.</p>
      ) : (
        <div className="upload-grid">
          {uploads.map((u, i) => {
            const isImage = /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(u.file_path);
            const isVideo = /\.(mp4|mov|webm|avi)$/i.test(u.file_path);
            return (
              <article key={u.id} className="upload-card">
                <div className="upload-card__media">
                  {isImage && urls[i] && (<img src={urls[i]!} alt="" />)}
                  {isVideo && urls[i] && (<video src={urls[i]!} controls />)}
                  {!isImage && !isVideo && (<div className="upload-card__placeholder">📎 {u.file_path.split("/").pop()}</div>)}
                </div>
                <div className="upload-card__info">
                  <div className="upload-card__kind">{u.kind}</div>
                  <div className="upload-card__caption">{u.caption || "(bez opisu)"}</div>
                  <div className="upload-card__meta">
                    {new Date(u.created_at).toLocaleString("pl-PL")} · {u.status}
                  </div>
                  {urls[i] && (
                    <a href={urls[i]!} target="_blank" rel="noopener" className="btn btn--ghost btn--small">
                      Otwórz
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
