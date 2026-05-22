## Sortable Builders table

Make column headers in the Admin → Builders tab clickable to sort the list. Default sort becomes **Protos, descending** so the most active prototype builders surface first.

### Behavior
- Clickable headers: Name, Neighborhood, Commits, Protos, Berries, Joined, Last active. (Email stays unsorted — not useful.)
- Click a header to sort ascending; click again to flip to descending.
- Active column shows a small ↑ / ↓ arrow next to the label.
- Search filter continues to work on top of the chosen sort.

### Technical
- File: `src/components/admin/BuildersTab.tsx` only. No DB changes — sorting is client-side on the rows returned by `admin_builders_overview`.
- Add `sortKey` + `sortDir` state, initialized to `{ key: 'prototypes_count', dir: 'desc' }`.
- Extend the existing `useMemo` to sort `filtered` by the chosen key, with sensible comparators for strings vs numbers vs ISO date strings.
- Wrap each sortable `<TableHead>` label in a button-styled span with the arrow indicator; keep current Tailwind classes and right-alignment on numeric columns.

### Out of scope
- No new tracking, no DB migration, no changes to the RPC.
- No CSV export or multi-column sort (can be follow-ups if useful).