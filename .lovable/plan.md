
# Landing Page Gallery + Library Restructuring

## Overview

Transform the landing page into a public gallery of remixable relational tech tools, and restructure the Library so that Prompts live underneath Tools as children. The current "Tools" list (Lovable, Replit, Supabase, etc.) becomes "Tech for Building."

---

## Database Schema Changes

### 1. Expand the `tools` table

Add columns to support gallery display and tool categorization:

- `image_url` (text, nullable) -- hero screenshot for gallery cards
- `screenshot_urls` (text[], nullable) -- additional screenshots for detail view
- `tool_category` (text, default `'relational_tech'`) -- distinguishes gallery tools from tech-for-building tools
- `summary` (text, nullable) -- short one-liner for gallery card display (separate from the longer `description`)

### 2. Add `parent_tool_id` to `prompts` table

- `parent_tool_id` (UUID, nullable, references `tools.id`) -- links a prompt as a child of a tool
- Existing prompts remain valid with `null` parent until we link them

### 3. Update existing tool entries

Set `tool_category = 'tech_for_building'` on all 8 existing tools (Lovable, Replit, Supabase, GitHub, Twilio, Resend, Dyad, Firecrawl).

### 4. Insert 10 gallery tool entries

Each with `tool_category = 'relational_tech'`, a summary, description, and `image_url` pointing to the uploaded screenshot:

| Tool Name | Screenshot | Matching Prompt to Link |
|-----------|-----------|------------------------|
| Neighborhood API | neighborhood_api.png | (none -- new) |
| Neighbor Story Sharing | neighbor_story_sharing.png | "Neighbor Story Sharing" |
| Our Neighborhood Today | (no screenshot uploaded) | "Neighborhood Today Calendar" |
| Hyperlocal Neighbor Hub | hyperlocal_neighbor_hub.png | "Hyperlocal Neighbor Hubs" |
| Community Apps Dashboard | community_apps_dashboard.png | (none -- new) |
| Microgrant Management | microgrant_management.png | "Microgrants Tool" |
| Neighborhood Association Hub | neighborhood_association_hub.png | "Neighborhood Association Hub" |
| Local Supplies Sharing | community-supplies.png | "Community Supplies" |
| Block Party Organizing | block_party_organizing.png | "Block Party Organizing" |
| Text-by-Tag | text_by_tag.png | (none -- new) |

### 5. Create tool parents for orphan prompts

These existing prompts don't match a gallery tool. Each gets a new tool entry (no screenshot, with a generated summary) and is linked via `parent_tool_id`:

- **Footer Component** -- "A clean, remixable footer component for neighborhood websites with origin story text, contact info, and remix invitation."
- **Privacy & Terms Page** -- "A ready-to-use privacy and terms page template for community-built neighborhood websites."
- **Neighborhood Connector Site** -- "A site for connecting neighbors through shared interests, gatherings, and local resources."
- **Neighborhood Groups Directory** -- "A directory of neighborhood groups and organizations for resource sharing and community connection."
- **Neighborhood Deep Time Scanner** -- "A reflective tool for exploring the deep history and future possibilities of your neighborhood."

### 6. Link all prompts to their parent tools

Update each prompt's `parent_tool_id` to point to the corresponding tool entry.

---

## Image Uploads

Copy the 8 user-uploaded screenshots to `public/images/gallery/` for use on the landing page and in tool cards. "Our Neighborhood Today" does not have an uploaded screenshot -- it will display without one (or with a placeholder).

---

## Landing Page Redesign (`src/pages/Landing.tsx`)

### New structure (top to bottom):

1. **Hero** -- Keep "You can build what you need" headline and "Craft relational tech for your people and place" subtitle

2. **Tool Gallery Grid** -- Replace the DemoChat with a responsive grid of tool cards. Each card shows:
   - Hero screenshot (the uploaded image)
   - Tool name
   - One-line summary
   - Clicking a card scrolls to or opens a lightweight detail view (or navigates to `/auth` with a "Remix this" prompt)

3. **"Enter Your Studio" CTA** -- Primary button below the gallery

4. **"What's Inside" Section** -- Three feature previews:
   - **Sidekick** -- Show a static mockup of the chat UI with description
   - **Library** -- Show a static mockup of the library grid with description
   - **Peer Network** -- Description card (as before)

5. **"What is Relational Tech?" Section** -- Keep as-is

6. **Footer** -- Keep as-is

### Gallery card component

New component `ToolGalleryCard` that renders:
- Screenshot image with rounded corners and subtle shadow
- Tool name (bold, font-fraunces)
- One-line summary
- On click: navigate to `/auth` (to enter studio and remix)

The gallery fetches tools from the database where `tool_category = 'relational_tech'` and `image_url IS NOT NULL` (so only gallery-ready tools appear on the landing page).

---

## Library Page Changes (`src/pages/Library.tsx`)

### Type filter updates

The current type filter buttons are: All, Stories, Prompts, Tools

Change to: **All, Stories, Tools, Tech for Building**

- **Tools** shows items from the `tools` table where `tool_category = 'relational_tech'`
- **Tech for Building** shows items from the `tools` table where `tool_category = 'tech_for_building'`
- **Prompts** filter is removed as a top-level filter -- prompts are now visible as children within tool detail views

### Tool detail view in Library

When viewing a relational tech tool in the Library detail dialog:
- Show the tool's screenshot(s)
- Show the summary and description
- Show child prompts listed below with a "Remix" button on each
- The "Discuss in Sidekick" button remains

### Data fetching update

Update `fetchLibraryItems` to:
- Fetch tools with their `tool_category` field
- Map `tool_category` into the display type ("tool" or "tech_for_building")
- Fetch prompts but only show them as children within tool views, not as standalone cards in the grid

---

## Type Updates (`src/types/library.ts`)

Update `ItemType` to include the new category:

```text
export type ItemType = "story" | "tool" | "tech_for_building";
```

Remove "prompt" as a standalone type. Add fields to `LibraryItem`:

- `imageUrl` (string, optional) -- hero image
- `screenshotUrls` (string[], optional) -- additional screenshots
- `toolCategory` (string, optional)
- `childPrompts` (array, optional) -- for tool items, their associated prompts

---

## LibraryCard Updates (`src/components/LibraryCard.tsx`)

- Show hero image at top of card if `imageUrl` exists
- For "tool" type items, show "Remix" button that navigates to Sidekick
- Remove standalone "prompt" card rendering (prompts appear inside tool details)
- "Tech for Building" cards keep the current external link behavior

---

## Sidekick Integration

- The "Remix" action on a tool navigates to Sidekick with context like: "I'd like to remix the [Tool Name] tool for my neighborhood"
- No changes needed to the edge function -- the existing remix flow works with tool names

---

## Files Summary

| File | Action |
|------|--------|
| Database migration | Add columns to `tools`, add `parent_tool_id` to `prompts`, seed 10+ tool entries, link prompts, recategorize existing tools |
| `public/images/gallery/*.png` | Copy 8 uploaded screenshots |
| `src/pages/Landing.tsx` | Full redesign: gallery grid, "What's Inside" section, remove DemoChat |
| `src/components/ToolGalleryCard.tsx` | New component for landing page gallery cards |
| `src/types/library.ts` | Update `ItemType`, add new fields |
| `src/pages/Library.tsx` | Replace Prompts filter with Tools/Tech for Building, show prompts as children of tools |
| `src/components/LibraryCard.tsx` | Add hero image display, tool detail with child prompts |
| `src/components/ContributionDialog.tsx` | Update to reflect new tool-first contribution model |

---

## What's Preserved

- All existing data remains intact (no deletions, no column drops)
- Stories unchanged
- Existing tool entries reclassified but not removed
- Existing prompts get a `parent_tool_id` but their data is untouched
- Auth flow, Sidekick, profile, bookmarks all unchanged
- DemoChat component kept in codebase (just removed from landing page)
