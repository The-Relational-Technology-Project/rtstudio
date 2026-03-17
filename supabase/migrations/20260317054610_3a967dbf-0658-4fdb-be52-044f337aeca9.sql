
CREATE TABLE gift_build_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  builder_name text NOT NULL,
  builder_email text,
  neighborhood text,
  idea_title text NOT NULL,
  idea_summary text NOT NULL,
  conversation_context text,
  source text NOT NULL DEFAULT 'support_page',
  user_id uuid
);

ALTER TABLE gift_build_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert gift build requests"
  ON gift_build_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
