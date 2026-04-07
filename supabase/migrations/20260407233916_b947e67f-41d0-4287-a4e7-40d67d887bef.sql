
CREATE TABLE public.studio_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  log_type text NOT NULL DEFAULT 'update',
  title text NOT NULL,
  description text NOT NULL,
  url text
);

ALTER TABLE public.studio_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio log is viewable by everyone"
  ON public.studio_log
  FOR SELECT
  TO public
  USING (true);

INSERT INTO public.studio_log (log_type, title, description) VALUES
  ('update', 'Hybrid search launched', 'Sidekick now combines vector similarity with keyword matching for better library results.'),
  ('update', 'Network feed integrated', 'Sidekick references the latest Relational Tech Network updates in conversations.'),
  ('update', 'Prompt delivery improved', 'Sidekick now wraps finished prompts in a copyable card with links to builder tools.'),
  ('contribution', 'Walking Tour app added', 'A new neighborhood history walking tour tool was contributed to the library.');
