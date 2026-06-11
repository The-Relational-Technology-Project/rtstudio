-- Deployment options + lineage for library tools.
--
-- A tool can now carry three take-up paths, surfaced on cards and in build plans:
--   1. Remix the prompt (always available via the Studio)
--   2. Fork the code (github_url — column already existed)
--   3. Use a hosted version (hosted_url + hosted_by, e.g. communitysupplies.org)
--
-- Lineage: creator attribution and a free-text lineage note, shown in the
-- library and carried into build plans so remixes keep a README lineage trail.
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS hosted_url text,
  ADD COLUMN IF NOT EXISTS hosted_by text,
  ADD COLUMN IF NOT EXISTS creator_name text,
  ADD COLUMN IF NOT EXISTS creator_url text,
  ADD COLUMN IF NOT EXISTS lineage_note text;
