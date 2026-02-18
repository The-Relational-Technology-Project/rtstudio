
# Profile & Library Enhancements

## What's Being Built

Two feature areas with supporting database changes:

1. **Profile: Local Tech Ecosystem field + editable Dreams & Goals**
2. **Library: "My Items" view, "Bookmarks" view, and bookmark toggle on cards**

---

## Database Changes Required

### 1. Add `local_tech_ecosystem` to `profiles`
A new nullable text column for the freeform ecosystem description. No existing data is affected.

### 2. Add `user_id` to `prompts` and `tools`
Currently neither table tracks who contributed an item, so "My Items" has no way to filter by owner. A nullable UUID column will be added to both. Existing rows remain untouched (null `user_id`). Contributions made going forward (via dialog or Sidekick) will capture the authenticated user's ID.

### 3. New `library_bookmarks` table
A simple join table: `(id, user_id, item_id, item_type, created_at)`. RLS: users can only SELECT/INSERT/DELETE their own rows.

---

## Feature 1 — Profile: Ecosystem Field & Editable Fields

### New "Local Tech Ecosystem" section in `Profile.tsx`
- Displayed below "Dreams & Goals" as a new card section using a `Network` icon (matches the relational tech theme)
- Shown whether or not it has content (with a prompt to fill it in if empty)
- Inline edit mode: clicking an Edit pencil icon on either "Dreams & Goals" or "Ecosystem" reveals a Textarea and Save/Cancel buttons
- Saves to the `profiles` table for the current user via `supabase.from('profiles').update(...)` 
- Calls `refreshProfile()` after saving so the AuthContext is up to date

### Sidekick context injection
In `chat-remix/index.ts`, the `profileContext` block already injects profile fields. A new line will be added:
```
- Local tech ecosystem: ${profile.local_tech_ecosystem || 'Not described yet'}
```
This gives Sidekick awareness of the builder's local ecosystem when remixing or suggesting tools.

### Onboarding
No change — this field is intentionally skipped in onboarding per the request.

---

## Feature 2 — Library: My Items, Bookmarks, and Bookmark Button

### Bookmark button on `LibraryCard`
- A `Bookmark` icon button appears in the card footer (and in the detail dialog)
- If the user is not signed in, clicking it shows a toast: "Sign in to bookmark items"
- If signed in, it toggles: inserts a row into `library_bookmarks` or deletes the existing row
- Filled/unfilled bookmark icon reflects current state
- The card needs to know the current user and their bookmark state — this is passed down from Library as a `Set<string>` of bookmarked item IDs and a toggle callback, keeping fetching centralized

### Library page view tabs
The existing type filter row gets a new "view" concept alongside it. Three view tabs are added above the filter row:
- **Browse** (default) — current behavior, all items
- **My Items** — shows only items where `user_id` matches the current user. Requires auth; shows a "Sign in to see your contributions" message if not logged in
- **Bookmarks** — shows only bookmarked items. Requires auth

"My Items" cards get two extra actions: **Edit** (opens an inline edit dialog) and **Delete** (with a confirmation step).

### Edit dialog for owned items
A new `EditLibraryItemDialog` component that reuses the existing form field patterns from `ContributionDialog`. It pre-fills with current values and saves via `supabase.from(table).update(...)`. Only visible on items the user owns.

### Delete confirmation
Uses the existing `AlertDialog` component (already in the project). On confirm, calls `supabase.from(table).delete().eq('id', item.id)` and refreshes the list.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| Database migration | Add `local_tech_ecosystem` to `profiles`; add `user_id` to `prompts` + `tools`; create `library_bookmarks` table with RLS |
| `src/contexts/AuthContext.tsx` | Add `local_tech_ecosystem` to the `Profile` interface |
| `src/pages/Profile.tsx` | Add editable Dreams & ecosystem sections with inline edit |
| `supabase/functions/chat-remix/index.ts` | Add `local_tech_ecosystem` to system prompt context |
| `src/types/library.ts` | Add `userId` to `LibraryItem` type |
| `src/pages/Library.tsx` | Add view tabs (Browse/My Items/Bookmarks), fetch bookmarks, pass ownership/bookmark state to cards |
| `src/components/LibraryCard.tsx` | Add bookmark button; accept `isBookmarked`, `onToggleBookmark`, `isOwned`, `onEdit`, `onDelete` props |
| `src/components/ContributionDialog.tsx` | Capture and save `user_id` on insert for prompts and tools (stories already have the column) |
| `src/components/EditLibraryItemDialog.tsx` | New component — edit form pre-filled with item data, saves updates |

---

## Data & Security Notes

- `library_bookmarks` RLS ensures users can only see and manage their own bookmarks — no cross-user visibility
- Ownership for "My Items" is enforced by filtering on `user_id = auth.uid()` client-side (data is public anyway per existing RLS), not by a new policy — this is appropriate since library content is intentionally public
- Existing stories/prompts/tools with `null` user_id won't appear in anyone's "My Items" view, which is correct (they are curator-added content, not builder contributions)
- The `local_tech_ecosystem` column follows the same profile RLS as all other profile fields: only the owner can read or write it
