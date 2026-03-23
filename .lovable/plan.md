

# Redesign Tool Cards in Library: Try It / Build It (Revised)

## Overview

Replace the current View/Visit/Remix button pattern on tool and tech_for_building Library cards with two clear actions: **"Try It"** and **"Build It"**. Add an optional **"join"** badge for tools where the existing instance is open to new communities.

## Database Changes

Add three columns to the `tools` table via migration:

- `is_joinable` (boolean, default false) — shows a "join" badge on the card
- `lovable_url` (text, nullable) — link to the Lovable project
- `github_url` (text, nullable) — link to the GitHub repo

Set `is_joinable = true` for Community Supplies only.

## UI Changes (LibraryCard.tsx)

**Card footer** for tool/tech_for_building types changes to:

```
[Try It]  [Build It]
```

- **Badge area**: Small "join" badge next to the type badge when `item.isJoinable` is true
- **Try It**: Opens the existing detail dialog (screenshot, longer description, external link). The dialog keeps its current content but the footer button inside it becomes "Visit" (opens URL in new tab) instead of the generic "Discuss in Sidekick". This preserves the current View experience as part of the Try It flow.
- **Build It**: Opens a separate dialog/panel showing three on-ramps:
  - **Prompt** — "The recipe that nearly builds it" — shows the tool's child prompt(s) from the `prompts` table
  - **Remix** — "Start a Sidekick chat" — triggers the existing `handleDiscussInSidekick` flow
  - **Source** — Platform-specific links: "View on Lovable" and/or "View on GitHub" using the new `lovable_url` / `github_url` fields

## Type Changes (src/types/library.ts)

Add to `LibraryItem`: `isJoinable?: boolean`, `lovableUrl?: string`, `githubUrl?: string`

## Data Mapping (Library.tsx)

Map new fields from tools query; fetch child prompts for tool items.

## Files Changed

| File | Change |
|------|--------|
| Migration | Add `is_joinable`, `lovable_url`, `github_url` columns; set Community Supplies joinable |
| `src/types/library.ts` | Add new fields |
| `src/pages/Library.tsx` | Map new fields; fetch prompts with tools |
| `src/components/LibraryCard.tsx` | Replace footer buttons with Try It / Build It; add join badge; add Build It panel; keep existing detail dialog for Try It |

