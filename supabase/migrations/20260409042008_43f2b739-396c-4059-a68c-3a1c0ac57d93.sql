
CREATE OR REPLACE FUNCTION public.increment_prototype_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prototype_counter
  SET count = count + 1, updated_at = now()
  WHERE id = 'global';
END;
$$;
