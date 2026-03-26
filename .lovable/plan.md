

# Integrate Relational Tech Network RSS Feed into Sidekick

## Overview

Fetch the public RSS feed (`https://updates.relationaltechproject.org/feed.xml`) inside the `chat-remix` edge function and inject recent network updates as additional context for Sidekick responses. This gives Sidekick awareness of what's happening across the open-source relational tech ecosystem — new projects joining, features being built, patterns emerging.

## Approach: Fetch + Cache in Edge Function

Since the feed is public XML, the edge function can fetch it directly. To avoid hitting the feed on every chat message, we cache parsed results in a `network_feed_cache` table with a TTL (e.g. 6 hours). If the cache is fresh, skip the fetch.

## Database Change

One small table to cache the parsed feed:

```sql
CREATE TABLE public.network_feed_cache (
  id text PRIMARY KEY DEFAULT 'latest',
  items jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.network_feed_cache ENABLE ROW LEVEL SECURITY;
-- No public RLS policies — only service role access from edge functions
```

## Changes to `chat-remix/index.ts`

After the library context is built (~line 406), add a new block:

1. Check `network_feed_cache` for a recent entry (< 6 hours old)
2. If stale or missing, fetch `https://updates.relationaltechproject.org/feed.xml`, parse XML to extract title, description, link, and pubDate from each `<item>`
3. Take the 10 most recent items
4. Upsert the parsed items into the cache table
5. Append a `RELATIONAL TECH NETWORK UPDATES` section to the system prompt context

The context block would look like:

```
RELATIONAL TECH NETWORK UPDATES (from the open-source ecosystem):
These are recent updates from projects in the Relational Tech Network — other builders creating
open-source neighborhood tools. Reference these when relevant to show what's growing in the ecosystem.

- [project-name] (date): description...
- [project-name] (date): description...
```

## System Prompt Addition

Add to the capabilities section:

```
5. NETWORK AWARENESS: You have access to recent updates from the Relational Tech Network —
   open-source projects tagged "relational-tech" on GitHub. When relevant, mention what other
   builders are creating across the ecosystem. This helps builders feel connected to a larger
   movement and discover patterns and ideas from other neighborhoods.
```

## XML Parsing

Deno supports `DOMParser` natively, so we can parse the RSS XML without external dependencies:

```typescript
const parser = new DOMParser();
const doc = parser.parseFromString(xmlText, "text/xml");
const items = doc.querySelectorAll("item");
```

## Files Changed

| File | Change |
|------|--------|
| Migration | Create `network_feed_cache` table |
| `supabase/functions/chat-remix/index.ts` | Add RSS fetch + cache logic; append network context to system prompt |

