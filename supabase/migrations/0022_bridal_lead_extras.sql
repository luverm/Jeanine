-- ============================================================
-- 0022_bridal_lead_extras.sql
-- Trial session timestamp + admin-only result photos.
-- result_paths stores object paths in the bridal-results storage bucket,
-- separate from attachment_paths (bride's own inspiration uploads).
-- ============================================================

alter table bridal_leads
  add column if not exists trial_session_at timestamptz,
  add column if not exists result_paths text[];

create index if not exists bridal_leads_trial_session_idx
  on bridal_leads (trial_session_at)
  where trial_session_at is not null;
