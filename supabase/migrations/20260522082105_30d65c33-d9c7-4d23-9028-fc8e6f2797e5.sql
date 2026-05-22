-- Studio tags lookup
CREATE TABLE public.studio_tags (
  slug text PRIMARY KEY,
  label text NOT NULL,
  color text,
  sort_order integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio tags are viewable by everyone"
  ON public.studio_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert studio tags"
  ON public.studio_tags FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update studio tags"
  ON public.studio_tags FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete studio tags"
  ON public.studio_tags FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

INSERT INTO public.studio_tags (slug, label, color, sort_order) VALUES
  ('rt', 'RT', '#c4654a', 10),
  ('thread', 'Thread', '#87a878', 20),
  ('bloom', 'Bloom', '#e8a87c', 30),
  ('nf', 'NF', '#6b3a2a', 40);

-- Tags + organizer consent on library items
ALTER TABLE public.stories
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN organizer_consent_to_contact boolean NOT NULL DEFAULT false;

ALTER TABLE public.prompts
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN organizer_consent_to_contact boolean NOT NULL DEFAULT false;

ALTER TABLE public.tools
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN organizer_consent_to_contact boolean NOT NULL DEFAULT false;

CREATE INDEX idx_stories_tags ON public.stories USING GIN(tags);
CREATE INDEX idx_prompts_tags ON public.prompts USING GIN(tags);
CREATE INDEX idx_tools_tags ON public.tools USING GIN(tags);

-- Connection requests (warm intros mediated by stewards)
CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  requester_user_id uuid,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  item_title text NOT NULL,
  message text NOT NULL DEFAULT '',
  conversation_snippet text,
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own connection requests"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Admins can view connection requests"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update connection requests"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

-- Validation trigger for item_type and status
CREATE OR REPLACE FUNCTION public.validate_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.item_type NOT IN ('story', 'prompt', 'tool') THEN
    RAISE EXCEPTION 'Invalid item_type: %', NEW.item_type;
  END IF;
  IF NEW.status NOT IN ('new', 'sent', 'declined') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_connection_request_trigger
  BEFORE INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_connection_request();