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

-- Services
insert into services (slug, name, description, kind, duration_min, buffer_min, price_cents, is_online_bookable, sort_order)
values
  ('knippen',           'Knippen',                'Wassen, knippen, drogen.',                       'regular', 45,  10, 4500,  true, 10),
  ('kleuren',           'Kleuren',                'Volledige kleurbehandeling incl. wassen.',       'regular', 120, 15, 9500,  true, 20),
  ('fohnen',            'Föhnen / styling',       'Föhnen of styling zonder knip.',                 'regular', 30,  5,  3000,  true, 30),
  ('bruid-proefsessie', 'Bruid — proefsessie',    'Proefsessie voor de grote dag.',                 'bridal',  90,  15, 12000, false, 40),
  ('bruid-styling',     'Bruid — styling op dag', 'Volledige hairstyling op de trouwdag.',          'bridal',  180, 30, 35000, false, 50)
on conflict (slug) do nothing;

-- Opening hours: Mon–Sat 09:00–17:00 (weekday: 0=Sun,1=Mon,...,6=Sat)
insert into opening_hours (staff_id, weekday, start_time, end_time)
select
  '00000000-0000-0000-0000-000000000001',
  d,
  time '09:00',
  time '17:00'
from generate_series(1, 6) as d
where not exists (
  select 1 from opening_hours
  where staff_id = '00000000-0000-0000-0000-000000000001' and weekday = d
);
