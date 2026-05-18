-- ────────────────────────────────────────────────────────────
-- 0002_rls.sql — Row Level Security
-- ────────────────────────────────────────────────────────────

-- Włączamy RLS na wszystkich tabelach
alter table profiles            enable row level security;
alter table clients             enable row level security;
alter table client_opiekun      enable row level security;
alter table status_pills        enable row level security;
alter table services            enable row level security;
alter table documents           enable row level security;
alter table calendar_items      enable row level security;
alter table notifications       enable row level security;
alter table monthly_reports     enable row level security;
alter table brand_assets        enable row level security;
alter table plan_milestones     enable row level security;
alter table client_tabs         enable row level security;
alter table client_uploads      enable row level security;
alter table chat_threads        enable row level security;
alter table chat_messages       enable row level security;
alter table global_copy         enable row level security;

-- Helper: czy zalogowany user jest adminem
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

-- Helper: czy user widzi danego klienta (owner / opiekun / admin)
create or replace function public.can_see_client(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists(select 1 from clients where id = c_id and owner_user_id = auth.uid())
    or exists(select 1 from client_opiekun where client_id = c_id and opiekun_user_id = auth.uid());
$$;

-- profiles: każdy widzi swój, admin wszystkich
create policy "profiles_self_read" on profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_write" on profiles for all using (public.is_admin()) with check (public.is_admin());

-- clients
create policy "clients_visible" on clients for select using (public.can_see_client(id));
create policy "clients_admin_write" on clients for all using (public.is_admin()) with check (public.is_admin());

-- client_opiekun
create policy "client_opiekun_visible" on client_opiekun for select using (public.can_see_client(client_id));
create policy "client_opiekun_admin_write" on client_opiekun for all using (public.is_admin()) with check (public.is_admin());

-- Tabele "per-client read"
do $$
declare t text;
begin
  for t in select unnest(array['status_pills','services','documents','calendar_items','notifications','monthly_reports','brand_assets','plan_milestones','client_tabs'])
  loop
    execute format('create policy %I on %I for select using (public.can_see_client(client_id))', t || '_visible', t);
    execute format('create policy %I on %I for all using (public.is_admin()) with check (public.is_admin())', t || '_admin_write', t);
  end loop;
end$$;

-- client_uploads: klient może wgrać swoje, każdy uprawniony może czytać
create policy "client_uploads_visible" on client_uploads for select using (public.can_see_client(client_id));
create policy "client_uploads_client_insert" on client_uploads for insert with check (public.can_see_client(client_id));
create policy "client_uploads_admin_write" on client_uploads for update using (public.is_admin()) with check (public.is_admin());
create policy "client_uploads_admin_delete" on client_uploads for delete using (public.is_admin());

-- chat: dostęp do wątku jeśli widzisz klienta
create policy "chat_threads_visible" on chat_threads for select using (public.can_see_client(client_id));
create policy "chat_threads_admin_write" on chat_threads for all using (public.is_admin()) with check (public.is_admin());

create policy "chat_messages_visible" on chat_messages for select using (
  exists (select 1 from chat_threads t where t.id = thread_id and public.can_see_client(t.client_id))
);
create policy "chat_messages_insert" on chat_messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from chat_threads t where t.id = thread_id and public.can_see_client(t.client_id))
);
create policy "chat_messages_update_self" on chat_messages for update using (sender_id = auth.uid() or public.is_admin());

-- global_copy: każdy zalogowany czyta, tylko admin edytuje
create policy "global_copy_read_all" on global_copy for select using (auth.uid() is not null);
create policy "global_copy_admin_write" on global_copy for all using (public.is_admin()) with check (public.is_admin());
