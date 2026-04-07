CREATE OR REPLACE FUNCTION public.match_library_items(query_embedding vector, match_threshold double precision DEFAULT 0.15, match_count integer DEFAULT 9)
 RETURNS TABLE(item_type text, item_id uuid, similarity double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT le.item_type, le.item_id,
    1 - (le.embedding <=> query_embedding) as similarity
  FROM library_embeddings le
  WHERE 1 - (le.embedding <=> query_embedding) > match_threshold
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
$$;