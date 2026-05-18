import { redirect } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Sec } from "@/components/ui/Sec";
import { Serif } from "@/components/ui/Serif";
import { createClient } from "@/lib/supabase/server";
import { getCurrentClientForUser } from "@/lib/db/panel";
import { uploadClientFile } from "./actions";

export default async function UploadPage() {
  const client = await getCurrentClientForUser();
  if (!client) redirect("/login");

  const supabase = await createClient();
  const { data: uploads } = await supabase
    .from("client_uploads")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <PageHero
        eyebrowLabel="Panel klienta"
        eyebrowAccent="Wyślij pliki"
        title={<>Wrzucasz, my <Serif>bierzemy.</Serif></>}
        sub="Zdjęcia salonu, filmiki z usług, materiały które chcesz nam dać do pracy. Wgrywasz tu, my widzimy od razu."
      />

      <Sec>
        <form action={uploadClientFile} className="upload-form" encType="multipart/form-data">
          <label className="admin-field">
            <span>Co to za pliki?</span>
            <select name="kind" defaultValue="zdjecie">
              <option value="zdjecie">Zdjęcia</option>
              <option value="filmik">Filmiki</option>
              <option value="inne">Inne</option>
            </select>
          </label>
          <label className="admin-field admin-field--full">
            <span>Krótki opis (opcjonalny)</span>
            <input name="caption" placeholder="Zdjęcia salonu po remoncie" />
          </label>
          <label className="admin-field admin-field--full upload-form__drop">
            <span>Pliki (możesz wybrać kilka naraz)</span>
            <input name="files" type="file" multiple accept="image/*,video/*,application/pdf" required />
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary">Wyślij</button>
          </div>
        </form>
      </Sec>

      <Sec dark title={<>Co już <Serif>nam wysłałaś.</Serif></>} sub="Ostatnie 20 plików.">
        {uploads && uploads.length > 0 ? (
          <ul className="upload-list">
            {uploads.map((u) => (
              <li key={u.id} className="upload-list__item">
                <div className="upload-list__kind">{u.kind}</div>
                <div className="upload-list__caption">{u.caption || "(bez opisu)"}</div>
                <div className="upload-list__meta">
                  {new Date(u.created_at).toLocaleString("pl-PL")} · {u.status}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-hint">Jeszcze nic nie wysłałaś. Wgraj pierwszą paczkę powyżej.</p>
        )}
      </Sec>
    </>
  );
}
