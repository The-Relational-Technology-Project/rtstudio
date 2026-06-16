
## Summary

Full-bleed Sidekick chat on Home, new `/network` page consolidating Events/Updates/Dev Resources/Suggest-a-Jam, Builder's Guide moved into the library as a "Tech for Building" tool (migration already applied), Gift Build form merged into Contact, Resources page + nav removed, Bookmarks tab icon updated.

## File changes

### Backend
- **New edge function** `supabase/functions/notify-jam-session/index.ts` — mirrors `notify-gift-build`, emails stewards via Resend, rate-limited 3/hr per identifier. No DB writes (kept lightweight; no new table).
- **`supabase/config.toml`** — register `notify-jam-session` with `verify_jwt = false`.
- **Migration** (already applied) — inserted `Relational Tech Process Guide` tool row in `tech_for_building` category, `sort_order = 0`, `url = /Builders_Guide_RTP.pdf`, full guide text in `description`, `show_on_landing = false`.

### New components
- `src/components/network/EventsSection.tsx` — lift `EventsSection` from `HomeSidebar.tsx` (with the Luma embed + count logic).
- `src/components/network/NetworkUpdatesSection.tsx` — lift `RTUpdatesSection` (GitHub feed + AI summaries).
- `src/components/network/StudioUpdatesSection.tsx` — lift `StudioUpdatesSection` (studio_log entries).
- `src/components/network/SuggestJamSession.tsx` — form (name, email, neighborhood, topic, description, preferred timing) calling `notify-jam-session`, success state inline.
- `src/components/network/DeveloperResources.tsx` — move the three Dev Resources sections from `Support.tsx` ("Connect Your AI Tool", "How It Fits Together", "Explore and Contribute").

### New page
- `src/pages/Network.tsx` — top-level page with shadcn `Tabs`: **Events**, **Suggest a Jam**, **Network Updates**, **Developer Resources**. Each tab renders the corresponding component(s). Studio Updates rolled into the Network Updates tab.

### Home + Sidekick refactor
- `src/components/Sidekick.tsx`:
  - When `fullPage`, drop the `Card`/border chrome and the fixed `h-[500px]`. Use `flex-1 flex flex-col` so messages area fills available height; composer sticks at the bottom. Outer wrapper becomes `h-full` (parent supplies height).
  - Add `onLibraryItemsChange?: (items: LibraryItemData[]) => void` prop, fire whenever `libraryItems` state changes.
  - When `fullPage`, do **not** render the inline "Referenced Library Items" list at the bottom or the `previewSlot` — Home will render those in the side panel. Keep current inline behavior for non-fullPage callers.
- `src/pages/Home.tsx`:
  - Remove `HomeSidebar` import + the mobile tab bar + collapsible sidebar entirely.
  - Layout: `<main class="flex-1 min-h-0 flex">` with two regions inside `max-w-[1400px] mx-auto w-full`:
    - Desktop (`lg:`): left = Sidekick (`flex-1`, fills height), right panel (`w-[380px] shrink-0 border-l overflow-y-auto`) shown only when there's a build plan or referenced items. Each region scrolls independently.
    - Mobile: single column; right-panel content stacks below the chat.
  - Track `libraryItems` state via `onLibraryItemsChange` callback from Sidekick; render `<BuildPlanPreview>` + `<LibraryItemPreview>` list in the side panel.
  - Remove `Footer` so chat truly fills the viewport (Home is the only route where it disappears; everywhere else keeps it).

### Contact page becomes "Gift Build Request and Contact"
- `src/pages/Contact.tsx` — rename heading, add Gift Build form section above the existing contact form (lifted from `Support.tsx`, reuses `notify-gift-build`). Two clearly-divided sections with their own intro copy.
- `src/components/Footer.tsx` — rename link label "Contact" → "Gift Build Request and Contact".

### Nav + Resources removal
- `src/components/TopNav.tsx` — replace `{ name: "Resources", path: "/support" }` with `{ name: "Network", path: "/network" }`.
- `src/App.tsx` — add `/network` route inside `AppLayout`; remove `/support` route and `Support` import.
- Delete `src/pages/Support.tsx` and `src/components/HomeSidebar.tsx` (no longer referenced).
- `src/components/Sidekick.tsx` quick-actions reference `/sidekick` indirectly — check for any "Resources"/"/support" links and update (Support page links to Sidekick, not the other way).

### Library
- `src/pages/Library.tsx` — swap `Star` icon import for `Bookmark` (from lucide-react), use it on the Bookmarks tab. Card already uses `Bookmark`/`BookmarkCheck`.

## Implementation notes
- After deploy, run admin "Re-embed library" so Sidekick can RAG-search the new Process Guide.
- Edge function deploys automatically when the file is written.
- No database schema changes beyond the already-applied tool row.

## Verification
- Build runs clean (`bun run build`).
- Visit `/home`: chat fills viewport, no sidebar/footer; side panel appears only when items/build plan exist.
- Visit `/network`: all four tabs render; submit a jam session test.
- Visit `/library`: Process Guide appears first in the Tech for Building filter; Bookmarks tab uses bookmark icon.
- Visit `/contact`: both forms present; footer link reads new label.
- `/support` returns 404.
