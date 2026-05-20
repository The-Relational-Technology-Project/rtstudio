CREATE OR REPLACE FUNCTION public.get_app_config(_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = private, public
AS $$
  SELECT value FROM private.app_config WHERE key = _key;
$$;

REVOKE EXECUTE ON FUNCTION public.get_app_config(text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_app_config(text) TO service_role;