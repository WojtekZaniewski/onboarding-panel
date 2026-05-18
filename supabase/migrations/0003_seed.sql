-- ────────────────────────────────────────────────────────────
-- 0003_seed.sql — globalne tagline'y + zaczątek treści
-- (Userów admin/opiekun/klient tworzy się przez panel Supabase
--  Authentication → Add user. Ten plik tylko zalewa contentu.)
-- ────────────────────────────────────────────────────────────

insert into global_copy (key, value) values
  ('hero.sub_default',   'Wszystko, co Twoje. Jest tu.'),
  ('hero.micro_default', 'Nie w mailu. Nie w głowie. Tu.'),
  ('care.hours',         'Pon–Pt, 9:00–18:00. W sprawach pilnych, WhatsApp odbierany do 21:00.'),
  ('closing.tag',        'Ty prowadzisz salon. My prowadzimy resztę.'),
  ('closing.lead_a',     'Inne salony walczą z chaosem.'),
  ('closing.lead_b',     'Ty masz kogoś, kto go ogarnia.'),
  ('closing.body',       'To nie jest obietnica, to jest to, co właśnie kupiłaś. I to miejsce jest na to dowodem.'),
  ('closing.cta_intro',  'Pytania? Twoi opiekunowie są jednym kliknięciem stąd.'),
  ('footer.quote',       'Ty prowadzisz salon. My prowadzimy resztę.'),
  ('brand.email',        'kontakt@beautyrise.pl'),
  ('brand.website',      'https://beautyrise.pl'),
  ('brand.instagram',    'https://instagram.com/beautyrise.pl'),
  ('brand.facebook',     'https://facebook.com/beautyrise.pl')
on conflict (key) do nothing;
