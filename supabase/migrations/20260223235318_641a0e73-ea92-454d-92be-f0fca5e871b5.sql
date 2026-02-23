
-- Rate limit tracking table for edge functions
CREATE TABLE public.rate_limit_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  identifier text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_endpoint_identifier ON public.rate_limit_attempts (endpoint, identifier, attempted_at DESC);

-- Auto-cleanup old entries (older than 1 day)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts WHERE attempted_at < now() - INTERVAL '1 day';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_rate_limits
AFTER INSERT ON public.rate_limit_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limit_entries();

-- RLS: no public access, only service role
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to rate limits"
ON public.rate_limit_attempts
FOR ALL
USING (false);
