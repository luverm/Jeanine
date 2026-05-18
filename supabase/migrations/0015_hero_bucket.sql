-- ============================================================
-- 0015_hero_bucket.sql
-- Public Storage bucket for the homepage hero slideshow images.
-- Uploads/deletes go through the service-role client (admin),
-- which bypasses RLS; public read is granted by the bucket's
-- `public` flag, so no extra storage policies are needed.
-- Idempotent: safe to re-run.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('hero', 'hero', true)
on conflict (id) do nothing;
