
# Semantic Search via Vector Embeddings — IMPLEMENTED

## Status: ✅ Complete (pending initial backfill)

### What was done

1. **Database**: pgvector extension enabled, `library_embeddings` table created with RLS (no public access), `match_library_items` RPC function for cosine similarity search
2. **`supabase/functions/embed-library/index.ts`**: New edge function that batch-embeds all library items using OpenAI `text-embedding-3-small`. Protected by `ADMIN_API_KEY`. Skips items with unchanged content hash.
3. **`supabase/functions/chat-remix/index.ts`**: RAG search upgraded — embeds user message via OpenAI, runs vector similarity search via `match_library_items` RPC. Falls back to keyword ILIKE search if vector search fails or returns no results.
4. **Secrets**: `OPENAI_API_KEY` added for embeddings API calls.

### Backfill command

To populate embeddings for existing library items, call:

```
POST https://ivrvpbqidysrwqrthpcp.supabase.co/functions/v1/embed-library
Authorization: Bearer <your ADMIN_API_KEY>
```

This only needs to run once. After that, call it again when new library items are added.
