-- ────────────────────────────────────────────────────────────
-- 0005_report_entries_current_work.sql
-- Tekstowe wpisy raportów + sekcja "Nad czym aktualnie pracujemy"
-- ────────────────────────────────────────────────────────────

create table if not exists report_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  period text not null,
  content text not null,
  display_order int default 0,
  created_at timestamptz default now()
);
alter table report_entries enable row level security;
drop policy if exists "report_entries_visible" on report_entries;
drop policy if exists "report_entries_admin_write" on report_entries;
create policy "report_entries_visible" on report_entries for select using (public.can_see_client(client_id));
create policy "report_entries_admin_write" on report_entries for all using (public.is_admin()) with check (public.is_admin());

create table if not exists current_work (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  detail text,
  display_order int default 0,
  created_at timestamptz default now()
);
alter table current_work enable row level security;
drop policy if exists "current_work_visible" on current_work;
drop policy if exists "current_work_admin_write" on current_work;
create policy "current_work_visible" on current_work for select using (public.can_see_client(client_id));
create policy "current_work_admin_write" on current_work for all using (public.is_admin()) with check (public.is_admin());

update clients
set visible_sections = visible_sections
  || '{"report_entries": true, "current_work": true}'::jsonb
where visible_sections is not null;

alter table clients alter column visible_sections set default
  '{"services":true,"documents":true,"calendar":true,"plan":true,"assets":true,"reports":true,"notifications":true,"opiekunowie":true,"report_entries":true,"current_work":true}'::jsonb;
