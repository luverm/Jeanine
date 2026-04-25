-- ============================================================
-- seed.sql — local demo data
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Single staff member (Jeanine). user_id stays NULL until magic-link
-- login; link manually via SQL once auth user exists.
insert into staff (id, display_name, email, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Jeanine',
  'jeanine@example.com',
  true
)
on conflict (id) do nothing;

-- Services — mirrored from src/content/services.ts. Keep in sync.
insert into services (slug, name, description, kind, duration_min, buffer_min, price_cents, is_online_bookable, sort_order)
values
  -- Knippen
  ('knippen-dames',                 'Dames knippen + stylen',                                                NULL,                                                                                              'regular', 60,  10, 3495,  true,  110),
  ('knippen-teen',                  'Meiden knippen + stylen teen (12–18 jaar)',                             NULL,                                                                                              'regular', 50,  10, 2995,  true,  120),
  ('knippen-junior',                'Meiden knippen + stylen junior (6–12 jaar)',                            NULL,                                                                                              'regular', 40,  10, 2595,  true,  130),
  ('knippen-mini',                  'Meiden knippen + stylen mini (0–6 jaar)',                               NULL,                                                                                              'regular', 30,  10, 1795,  true,  140),
  ('pony-bijknippen',               'Pony of curtain bangs bijknippen',                                      NULL,                                                                                              'regular', 15,  5,  995,   true,  150),
  -- Party hair & make-up
  ('feestkapsel',                   'Feestkapsel',                                                           'Kom met schoon, droog haar: graag vooraf 2 keer wassen met shampoo.',                              'regular', 90,  15, 4995,  true,  210),
  ('feestkapsel-extensions',        'Feestkapsel incl. clip-in haarextensions',                              'Kom met schoon, droog haar: graag vooraf 2 keer wassen met shampoo.',                              'regular', 90,  15, 7495,  true,  220),
  ('feestkapsel-makeup',            'Feestkapsel incl. make-up',                                             NULL,                                                                                              'regular', 120, 15, 7495,  true,  230),
  ('feestkapsel-mini',              'Feestkapsel mini (0–6 jaar)',                                           NULL,                                                                                              'regular', 30,  10, 1995,  true,  240),
  ('feestkapsel-kids',              'Feestkapsel kids (6–12 jaar)',                                          NULL,                                                                                              'regular', 45,  10, 2995,  true,  250),
  -- Kleuren
  ('kleur-highlights-half',         'High en/of lowlights — Half head',                                      'Subtiele, fijne plukjes die je haar een frisse uitstraling geven.',                               'regular', 240, 15, 13995, true,  310),
  ('kleur-highlights-full',         'High en/of lowlights — Full head',                                      NULL,                                                                                              'regular', 240, 15, 15995, true,  320),
  ('kleur-toner',                   'Toner / glansbehandeling (incl. föhnen en stylen)',                     'Voor het opfrissen van blond, neutraliseren van warmte of extra glans.',                          'regular', 80,  10, 4495,  true,  330),
  ('kleur-spoeling',                'Kleurspoeling (incl. föhnen en stylen)',                                'Verfrissende, tijdelijke kleuring die glans en diepte geeft. Wast geleidelijk uit.',              'regular', 120, 15, 6995,  true,  340),
  -- Bridal — request only, not online bookable
  ('bruid-locatie-haar',            'Aanvraag: bruidshaarstyling op locatie incl. proefsessie',              NULL,                                                                                              'bridal',  240, 30, 24000, false, 410),
  ('bruid-locatie-haar-makeup',     'Aanvraag: bruidshaarstyling en make-up op locatie incl. proefsessie',   NULL,                                                                                              'bridal',  240, 30, 31500, false, 420),
  ('bruid-proefsessie-haar',        'Proefsessie bruidshaarstyling',                                         NULL,                                                                                              'bridal',  180, 30, 0,     false, 430),
  ('bruid-proefsessie-haar-makeup', 'Proefsessie bruidshaarstyling en make-up',                              NULL,                                                                                              'bridal',  210, 30, 0,     false, 440)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      kind = excluded.kind,
      duration_min = excluded.duration_min,
      buffer_min = excluded.buffer_min,
      price_cents = excluded.price_cents,
      is_online_bookable = excluded.is_online_bookable,
      sort_order = excluded.sort_order;

-- Opening hours: Mon–Fri 09:00–17:00 (weekday: 0=Sun,1=Mon,...,6=Sat).
-- Saturdays are reserved for bridal styling, scheduled via consult.
insert into opening_hours (staff_id, weekday, start_time, end_time)
select
  '00000000-0000-0000-0000-000000000001',
  d,
  time '09:00',
  time '17:00'
from generate_series(1, 5) as d
where not exists (
  select 1 from opening_hours
  where staff_id = '00000000-0000-0000-0000-000000000001' and weekday = d
);
