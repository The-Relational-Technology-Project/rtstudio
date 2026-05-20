## What's broken

Sidekick links every referenced library item to `/library?item={id}`. That works for stories and tools (each rendered as a top-level card with `id="library-item-{id}"`), but **prompts are not top-level cards** — `Library.tsx` folds them into their parent tool's `childPrompts` array, and they only surface inside the tool's "Build It" dialog. So when someone clicks "Neighborhood Today Calendar" or "Street Beat Newsletter Generator", the URL is valid, the prompt exists in the DB, but there's no DOM node to scroll to and nothing visible changes — the user lands on the generic Library page.

## Fix

When the deep-link `?item={id}` resolves to a prompt (not a story or tool), redirect the highlight to the prompt's **parent tool** and auto-open that tool's Build It dialog with the right prompt pre-expanded.

### Steps

1. **`Library.tsx` — track prompts separately so we can resolve them**
   - In `fetchLibraryItems`, keep a `Map<promptId, parentToolId>` (built from the same `promptsData` already fetched).
   - Store it in state alongside `items`.

2. **`Library.tsx` — extend the deep-link effect**
   - When `searchParams.get("item")` matches a prompt ID:
     - Look up the parent tool ID from the map.
     - Set `highlightedItemId` and scroll target to the **tool** card.
     - Pass a new `autoOpenPromptId` prop down to that tool's `LibraryCard` so it knows to open Build It and expand that prompt.
   - When it matches a story or tool: behave exactly as today.
   - When it matches nothing (orphan prompt, deleted item): show a small toast ("That item isn't available") instead of failing silently.

3. **`LibraryCard.tsx` — accept and act on `autoOpenPromptId`**
   - New optional prop `autoOpenPromptId?: string`.
   - On mount / when it changes, if the prop is set and matches one of `item.childPrompts`, set `isBuildItOpen = true` and `expandedPromptId = autoOpenPromptId`.

4. **No backend changes.** Prompts stay nested under tools (existing model). No new routes.

### Out of scope

- Promoting prompts to top-level Library cards (would change the whole browse model — separate conversation).
- Changing how Sidekick formats library references in chat.

### Files touched

- `src/pages/Library.tsx`
- `src/components/LibraryCard.tsx`
