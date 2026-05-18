-- ────────────────────────────────────────────────────────────
-- 0004_section_visibility.sql — per-klient widoczność sekcji
-- ────────────────────────────────────────────────────────────

alter table clients
  add column if not exists visible_sections jsonb
  default '{"services":true,"documents":true,"calendar":true,"plan":true,"assets":true,"reports":true,"notifications":true,"opiekunowie":true}'::jsonb;

update clients
  set visible_sections = '{"services":true,"documents":true,"calendar":true,"plan":true,"assets":true,"reports":true,"notifications":true,"opiekunowie":true}'::jsonb
  where visible_sections is null;
