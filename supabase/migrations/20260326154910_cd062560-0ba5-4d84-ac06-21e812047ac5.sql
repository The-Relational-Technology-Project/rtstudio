CREATE TABLE public.network_feed_cache (
  id text PRIMARY KEY DEFAULT 'latest',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.network_feed_cache ENABLE ROW LEVEL SECURITY;
-- No public RLS policies — only service role access from edge functions