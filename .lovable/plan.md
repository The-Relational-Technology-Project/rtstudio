

# Improve Sidekick Search: Hybrid Vector + Keyword

## Problem

The current search uses vector-first with a binary fallback: if vector search returns any results above the 0.25 threshold, keyword search is skipped entirely. This means a query like "walking tour" can match general items semantically but miss the exact "Walking App" tool that would have been caught by keyword matching.

## Solution: Hybrid Search (Always Run Both, Merge Results)

Instead of vector-OR-keyword, always run both and merge results with deduplication. This ensures exact keyword matches are never lost.

## Changes

### 1. Lower vector threshold from 0.25 to 0.15

Widens the net for semantic matches without sacrificing relevance (cosine similarity of 0.15 still indicates meaningful relatedness with `text-embedding-3-small`).

### 2. Always run keyword search alongside vector search

Remove the `if (!usedVectorSearch)` gate. Run keyword search every time regardless of vector results.

### 3. Merge and deduplicate results

Combine vector and keyword results, preferring vector-matched items (they have similarity scores) but adding any keyword-only matches that vector search missed. Cap at 3 per type.

### 4. Update `match_library_items` RPC default threshold

Change the function's default `match_threshold` parameter from 0.3 to 0.15 to match the new calling convention.

## Technical Detail

In `supabase/functions/chat-remix/index.ts` (~line 296-400):

```text
BEFORE:
  vector search (threshold 0.25) → if results, done
  ELSE keyword search

AFTER:
  vector search (threshold 0.15) → collect results
  keyword search → always run, collect results
  merge: vector results first, then keyword-only items not already found
  cap at 3 per type
```

## Files Changed

| File | Change |
|------|--------|
| Migration | Update `match_library_items` default threshold to 0.15 |
| `supabase/functions/chat-remix/index.ts` | Lower threshold to 0.15; remove fallback gate; add merge/dedup logic |

