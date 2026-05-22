## Library tags + warm-intro signaling

Two related additions to the Library, both managed from the admin Library tab.

---

### Part 1 — Studio tags (federation prep)

Add a multi-value `tags` field to every Library item so a single shared backend can later power separate Thread / RT / Bloom / NF front-ends by filtering on tag.

**Schema**
- New table `studio_tags` seeded with: `RT`, `Thread`, `Bloom`, `NF` (slug + label + optional color). Admin-managed; public read so future federated front-ends can resolve labels.
- Add `tags text[] not null default '{}'` to `stories`, `prompts`, `tools`.
- GIN index on each `tags` column for fast `WHERE 'thread' = ANY(tags)` lookups.
- RLS: tags are part of the row, so existing public-read policies cover them. Admin-only update via existing `is_admin` policies.

**Admin UI** (`LibraryAdminTab.tsx`)
- New column "Tags" showing colored chips per row.
- Click chips on a row → inline multi-select popover writes back to the row's table.
- New filter pill row above the table: `All / RT / Thread / Bloom / NF / Untagged`, additive to the existing type filter and search.
- Bulk action when rows are selected: "Set tags…" applies the same tag set to all selected items across types.

**Public Library** — no visible change yet. Items without tags continue to show for everyone (current behavior). Future federated front-ends will filter.

---

### Part 2 — Organizer-consent flag + warm intros via Sidekick

Skip storing contact info in the DB (too sensitive, low volume right now). Just track whether an organizer has agreed to receive intros, and let Sidekick offer to forward interest to the admins, who handle the actual handoff out-of-band.

**Schema**
- Add `organizer_consent_to_contact boolean not null default false` to `stories`, `prompts`, `tools`.
- New table `connection_requests`:
  - `id`, `created_at`
  - `requester_user_id` (nullable for safety)
  - `item_type` (`story` | `prompt` | `tool`), `item_id`, `item_title` (snapshot)
  - `message` (the builder's reason, captured by Sidekick)
  - `conversation_snippet` (last few turns for admin context)
  - `status` (`new` | `sent` | `declined`), default `new`
- RLS: builders can insert their own row; admins can read/update; nobody else can read.

**Admin UI**
- New "Contact OK" toggle column in the Library admin table (only meaningful for items with a real-world organizer; toggle is fine across all three types).
- New "Connection Requests" admin tab listing pending requests: requester name + email + neighborhood, item title (with deep-link to Library), message, snippet, "Mark sent / declined" buttons.

**Sidekick (`chat-remix/index.ts`)**
- When library items are retrieved, include their `organizer_consent_to_contact` flag in the context fed to the model.
- New tool `request_organizer_intro({ item_type, item_id, message })`. Sidekick may call it ONLY after:
  1. The item has consent = true, AND
  2. The builder has expressed sustained interest (2+ turns about it, OR an explicit "I want to do this / join / replicate it"), AND
  3. The builder confirms they want an intro in the current turn.
- Tool handler inserts a `connection_requests` row and fires the new `notify-connection-request` edge function.
- Update Sidekick system-prompt section to document the offer-then-confirm flow; reinforce that contact info is NEVER shared in chat — only the admins make the intro.

**New edge function `notify-connection-request`**
- Auth: validate JWT; require requester to be the calling user.
- Resend email to admins (Josh + you) with: requester name/email/neighborhood, item title + link, builder's message, conversation snippet.

---

### Part 3 — UI nudge for organizer consent on new contributions

To grow the pool of "Contact OK" items naturally:
- Add a single optional checkbox to the existing `ContributionDialog`: *"I'm the organizer (or have their blessing) and OK with builders being introduced through the studio stewards."*
- When admins promote a contribution to a Library item, that checkbox prefills the new `organizer_consent_to_contact` field.
- Same checkbox on the admin `NewLibraryItemDialog` for items added directly.

No changes to the contribution flow shape — just one extra optional field.

---

### Out of scope (for this round)
- No per-studio front-ends or routing yet — just the data layer + admin controls.
- No storing organizer contact details in the DB. Admins keep that in Notion / their own systems.
- No automatic detection of "sustained interest" beyond what Sidekick infers from the conversation.
- No public visibility of tags or consent on Library cards (can add later).