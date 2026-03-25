

# Semantic Search via Vector Embeddings

## Overview

Replace keyword-based ILIKE search in Sidekick's RAG with vector similarity search using pgvector and OpenAI embeddings. Every library item gets an embedding vector; user messages get embedded at query time and matched via cosine similarity.

## Important Note

Anthropic/Claude does not offer an embeddings endpoint. This plan uses **OpenAI's `text-embedding-3-small`** model ($0.02 per 1M tokens — effectively free for this scale). You'll need an OpenAI API key.

## Architecture

```text
User message
    │
    ▼
chat-remix edge function
    │
    ├─ Embed user message (OpenAI text-embedding-3-small)
    │
    ├─ Vector similarity search across library_embeddings table
    │   (pgvector cosine distance, top 3 per type)
    │
    ├─ Build library context from top matches
    │
    └─ Send to Lovable AI gateway (unchanged)
```

## Database Changes

**Migration 1: Enable pgvector + create embeddings table**

```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.library_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,        -- 'story', 'prompt', 'tool'
  item_id uuid NOT NULL,
  content_hash text NOT NULL,     -- detect when content changes
  embedding vector(1536) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (item_type, item_id)
);

CREATE INDEX ON public.library_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
```

RLS: No public access (only service role reads/writes from edge functions).

**Migration 2: Similarity search function**

```sql
CREATE OR REPLACE FUNCTION match_library_items(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 9
)
RETURNS TABLE (item_type text, item_id uuid, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT item_type, item_id, 
    1 - (embedding <=> query_embedding) as similarity
  FROM library_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## New Edge Function: `embed-library`

Batch-embeds all library items. Called manually to backfill, and can be triggered when items are added/updated.

- Fetches all stories, prompts, tools
- For each item, generates a text blob: `"{title} | {category} | {description/summary} | {content snippet}"`
- Hashes the text, skips items with matching `content_hash`
- Calls OpenAI embeddings API in batches of 50
- Upserts into `library_embeddings`
- Protected by `ADMIN_API_KEY` (same pattern as `admin-profiles`)

## New Secret

- `OPENAI_API_KEY` — needed for the embeddings API calls

## Changes to `chat-remix/index.ts`

Replace the keyword extraction + ILIKE search block (lines ~268-365) with:

1. Call OpenAI embeddings API to embed the latest user message (single API call, ~2ms)
2. Call `match_library_items` RPC with the query embedding
3. Fetch full item details for the top matches (same as current: title, description, etc.)
4. Build library context string (same format as current)

Everything downstream (system prompt, tool calls, contribution logic) stays unchanged.

## Fallback

If the OpenAI embeddings call fails (rate limit, network), fall back to the existing keyword search so Sidekick never breaks.

## Files Changed

| File | Change |
|------|--------|
| Migration | Enable pgvector, create `library_embeddings` table + index + RPC |
| `supabase/functions/embed-library/index.ts` | New: batch embed all library items |
| `supabase/functions/chat-remix/index.ts` | Replace keyword search with vector similarity |
| `supabase/config.toml` | Add `[functions.embed-library]` with `verify_jwt = false` |
| Secret: `OPENAI_API_KEY` | New secret for embeddings API |

## Keeping Embeddings Fresh

After the initial backfill, the `embed-library` function can be called:
- Manually after adding new library items
- Or we add a small check in `chat-remix`: if an item has no embedding, embed it on the fly and cache it

## Cost

~30 library items x ~500 tokens each = ~15K tokens per full sync. At $0.02/1M tokens, a full re-embed costs fractions of a cent. Per-query embedding is ~50 tokens = effectively free.

