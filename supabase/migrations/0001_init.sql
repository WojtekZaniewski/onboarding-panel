-- ────────────────────────────────────────────────────────────
-- 0001_init.sql — schema bazy danych BeautyRise panel
-- ────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Role użytkowników
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'opiekun', 'klient');
  end if;
end$$;

-- Profile (rozszerzenie auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  initials text,
  phone text,
  email text,
  whatsapp_url text,
  created_at timestamptz default now()
);

-- Klient = jeden salon
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  salon_name text not null,
  display_first_name text not null,
  display_short text not null,
  avatar_initials text not null,
  case_status text default 'aktywna',
  hero_eyebrow text default 'Panel klienta',
  hero_sub text default 'Wszystko, co Twoje. Jest tu.',
  hero_micro text default 'Nie w mailu. Nie w głowie. Tu.',
  created_at timestamptz default now()
);
create index if not exists clients_owner_idx on clients(owner_user_id);

-- Wielu opiekunów do klienta
create table if not exists client_opiekun (
  client_id uuid references clients(id) on delete cascade,
  opiekun_user_id uuid references auth.users(id) on delete cascade,
  display_order int default 0,
  primary key (client_id, opiekun_user_id)
);

-- Status pills (per-klient, dynamiczne)
create table if not exists status_pills (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  icon text,
  label text not null,
  variant text default 'default',
  display_order int default 0
);

-- Usługi
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  icon text,
  title text not null,
  body text,
  status text not null default 'w_robocie',
  link_href text,
  link_label text,
  display_order int default 0
);

-- Dokumenty
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  category text not null,
  icon text default '📄',
  name text not null,
  meta text,
  file_path text not null,
  uploaded_at timestamptz default now()
);

-- Kalendarz contentu
create table if not exists calendar_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  publish_date date not null,
  title text not null,
  meta text,
  channel text,
  display_order int default 0
);

-- Powiadomienia
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  meta text,
  action_url text,
  is_new boolean default true,
  created_at timestamptz default now()
);

-- Raporty miesięczne
create table if not exists monthly_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  period text not null,
  file_path text,
  pages int,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Brand assets
create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  kind text not null,
  title text not null,
  meta text,
  icon_text text,
  icon_gradient text,
  file_path text,
  display_order int default 0
);

-- Plan 30/90
create table if not exists plan_milestones (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  code text not null,
  title text not null,
  body text,
  badge_status text default 'upcoming',
  display_order int default 0
);

-- Per-klient zakładki
create table if not exists client_tabs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  slug text not null,
  label text not null,
  display_order int default 0,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(client_id, slug)
);

-- Uploady OD klienta (klient → admin)
create table if not exists client_uploads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  kind text default 'zdjecie',
  caption text,
  file_path text not null,
  status text default 'nowe',
  created_at timestamptz default now()
);
create index if not exists client_uploads_client_idx on client_uploads(client_id, created_at desc);

-- Czat: jeden wątek per klient (klient + opiekunowie + admin)
create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade unique,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chat_threads(id) on delete cascade,
  sender_id uuid references auth.users(id),
  body text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  read_by jsonb default '[]'::jsonb
);
create index if not exists chat_messages_thread_idx on chat_messages(thread_id, created_at);

-- Globalne tagline'y / copy
create table if not exists global_copy (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Automatyczne ustawianie owner_user_id na profiles tworzonego usera
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'klient'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
