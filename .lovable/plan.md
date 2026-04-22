

## Goal
Add a "My Prototypes" section to the Profile page so you can revisit every prototype you've ever built — including the Thread Baltimore one from today's demo (which did save successfully even though it didn't render under the chat).

## What you'll see on the Profile page

A new section placed **after Vision Board, before Serviceberries** (matches the existing flow of "creative output" → "engagement metrics"):

```text
┌─ My Prototypes ──────────────────────────── 12 builds ─┐
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Thread       │  │ Block party  │  │ Tool library │  │
│  │ Baltimore    │  │ planner      │  │ for Hampden  │  │
│  │ skills...    │  │              │  │              │  │
│  │              │  │              │  │              │  │
│  │ 2 hrs ago    │  │ Yesterday    │  │ 3 days ago   │  │
│  │ [Open] [↗]   │  │ [Open] [↗]   │  │ [Open] [↗]   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Each card shows:
- **Tool name** (or first ~60 chars of the prompt if no name)
- **Relative time** ("2 hrs ago")
- **[Open]** → opens the prototype in the existing `/prototype/:shareId` viewer (full screen iframe)
- **[↗ Share]** → copies the public share link if `is_shared = true`, otherwise shows "Make shareable" toggle

Empty state: "You haven't built any prototypes yet. Try building one from a Sidekick conversation."

## Files to change

| File | Change |
|------|--------|
| `src/components/MyPrototypes.tsx` (new) | Fetches `prototypes` for `auth.uid()`, renders grid of cards. Uses existing RLS — no backend changes. |
| `src/pages/Profile.tsx` | Import and render `<MyPrototypes />` between `<VisionBoard />` and the Serviceberries block. |

## Out of scope
- No new DB columns, migrations, or RLS changes (everything needed is already there).
- No edit/delete of prototypes (the table doesn't allow delete by design).
- No thumbnail previews — just text cards. (Could add iframe thumbnails later if you want.)
- No changes to the prototype builder itself or to why today's demo didn't render inline (that's the separate retry/error-handling work we discussed).

## Bonus: confirming Thread Baltimore exists
After this ships, your Profile will show the Thread Baltimore prototype from today's 15:25 UTC build at the top of the grid, and you can click [Open] to view it in the share viewer.

