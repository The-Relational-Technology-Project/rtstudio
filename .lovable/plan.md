
# Tag library items by Studio (federation)

Goal: lay the foundation for multiple front-end studios (Thread, RT, Bloom, …) to share this Supabase backend as a commons. Each library item (story, prompt, tool) can belong to one or more studios. Admins tag and filter from the existing Library admin tab.

## 1. Database

Create a lookup table for studios and a single join table that covers all three item types via a polymorphic `(item_type, item_id)` pair — mirrors the pattern already used by `library_bookmarks` and `library_embeddings`.

**New tables:**

- `studios`
  - `slug text primary key` (e.g. `thread`, `rt`, `bloom`)
  - `label text not null` (e.g. `Thread Studio`)
  - `color text` (HSL token name or hex, optional)
  - `description text`
  - `sort_order int default 50`
  - `created_at timestamptz default now()`
- `library_studio_assignments`
  - `id uuid pk`
  - `studio_slug text references studios(slug) on delete cascade`
  - `item_type text` (validated by trigger: `story | prompt | tool`)
  - `item_id uuid not null`
  - `created_at timestamptz default now()`
  - unique `(studio_slug, item_type, item_id)`
  - index on `(item_type, item_id)` for join fetches

**RLS:**

- `studios`: public `SELECT`; `INSERT/UPDATE/DELETE` admin-only via `is_admin(auth.uid())`.
- `library_studio_assignments`: public `SELECT` (so future front-ends can filter without auth); `INSERT/DELETE` admin-only. No `UPDATE` policy needed — delete + reinsert.

**Seed:** insert `thread`, `rt`, `bloom` rows so the UI has something to show day one.

## 2. Admin UI

Single file touched: `src/components/admin/LibraryAdminTab.tsx` (+ a tiny new dialog component).

- Fetch `studios` and assignments alongside the existing parallel fetch in `fetchAll`. Build a `Map<itemId, string[]>` of studio slugs per item.
- **New column** "Studios" in the admin table showing colored badges per studio assignment (between Author and Created).
- **Filter row addition**: a second chip row "Studio: All / Thread / RT / Bloom / Untagged" that AND-combines with the existing type filter and search.
- **Per-row action**: a small tag icon button that opens a popover with studio checkboxes — toggles add/remove assignments instantly.
- **Bulk action**: when items are selected, add an "Assign studios…" button next to the existing Reassign owner / Delete. Opens a dialog with studio checkboxes plus "Add to selected" / "Remove from selected" radio.

No changes to the New / Edit item dialogs in this pass — tagging happens in the table view, which is faster for bulk classification.

## 3. Out of scope (for now)

- Front-end filtering on the public Library page (still shows everything; per-studio front-ends will come later as separate deployments querying with `.contains` / join).
- Studio CRUD UI for non-admins or a "manage studios" admin screen — we seed the three rows directly; adding more is a one-line SQL insert until there's demand.
- Auto-tagging on item creation. Items default to untagged; admins triage from the new filter view.
- Sidekick / RAG scoping by studio. Sidekick continues to see everything.

## Technical details

- Migration runs first as a separate `supabase--migration` call (per workflow rules), then code changes follow.
- Validation trigger on `library_studio_assignments.item_type` (per project memory: triggers, not CHECK constraints).
- Assignments fetched as a single `select studio_slug, item_type, item_id from library_studio_assignments` and grouped client-side — fine at current library size (~hundreds of items, no pagination per existing convention).
- Toggle/bulk writes use `supabase.from('library_studio_assignments').insert(...)` and `.delete().match(...)`; optimistic local state update then refetch on dialog close.
- Studio badge color comes from `studios.color` if set, otherwise falls back to a neutral muted token — keeps the HSL semantic-token rule intact (we'll store HSL values or token names, never raw hex in components).
