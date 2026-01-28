-- Create magic link tokens table for custom auth flow
CREATE TABLE public.magic_link_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast token lookup
CREATE INDEX idx_magic_link_tokens_token ON public.magic_link_tokens(token);
CREATE INDEX idx_magic_link_tokens_email ON public.magic_link_tokens(email);

-- Enable RLS but allow service role to manage tokens
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
CREATE POLICY "No public access to magic link tokens"
ON public.magic_link_tokens
FOR ALL
USING (false);

-- Auto-cleanup expired tokens (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_magic_link_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.magic_link_tokens 
  WHERE expires_at < now() - INTERVAL '1 day';
  RETURN NEW;
END;
$function$;

CREATE TRIGGER cleanup_old_tokens
AFTER INSERT ON public.magic_link_tokens
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_magic_link_tokens();