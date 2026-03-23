ALTER TABLE public.tools 
  ADD COLUMN is_joinable boolean NOT NULL DEFAULT false,
  ADD COLUMN lovable_url text,
  ADD COLUMN github_url text;

UPDATE public.tools SET is_joinable = true WHERE name = 'Community Supplies';