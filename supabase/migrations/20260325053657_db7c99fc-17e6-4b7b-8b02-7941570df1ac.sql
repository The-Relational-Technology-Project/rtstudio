
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

CREATE TABLE IF NOT EXISTS public.library_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  content_hash text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (item_type, item_id)
);

ALTER TABLE public.library_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to embeddings"
  ON public.library_embeddings
  FOR ALL
  TO public
  USING (false);

CREATE OR REPLACE FUNCTION public.match_library_items(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 9
)
RETURNS TABLE (item_type text, item_id uuid, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT le.item_type, le.item_id,
    1 - (le.embedding <=> query_embedding) as similarity
  FROM library_embeddings le
  WHERE 1 - (le.embedding <=> query_embedding) > match_threshold
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
$$;
