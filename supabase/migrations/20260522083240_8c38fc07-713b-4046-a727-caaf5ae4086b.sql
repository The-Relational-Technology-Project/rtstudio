
-- Studios lookup table
CREATE TABLE public.studios (
  slug text PRIMARY KEY,
  label text NOT NULL,
  color text,
  description text,
  sort_order integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studios are viewable by everyone"
  ON public.studios FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert studios"
  ON public.studios FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update studios"
  ON public.studios FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete studios"
  ON public.studios FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Polymorphic assignment table
CREATE TABLE public.library_studio_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_slug text NOT NULL REFERENCES public.studios(slug) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (studio_slug, item_type, item_id)
);

CREATE INDEX idx_lsa_item ON public.library_studio_assignments (item_type, item_id);

-- Validation trigger (no CHECK constraints per project convention)
CREATE OR REPLACE FUNCTION public.validate_library_studio_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.item_type NOT IN ('story', 'prompt', 'tool') THEN
    RAISE EXCEPTION 'Invalid item_type: %', NEW.item_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_library_studio_assignment
  BEFORE INSERT OR UPDATE ON public.library_studio_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_library_studio_assignment();

ALTER TABLE public.library_studio_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments are viewable by everyone"
  ON public.library_studio_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert assignments"
  ON public.library_studio_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete assignments"
  ON public.library_studio_assignments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Seed initial studios
INSERT INTO public.studios (slug, label, color, sort_order) VALUES
  ('rt', 'Relational Tech Studio', 'hsl(15 65% 55%)', 10),
  ('thread', 'Thread Studio', 'hsl(200 55% 50%)', 20),
  ('bloom', 'Bloom Studio', 'hsl(330 60% 60%)', 30);
