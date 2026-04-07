

# RT Studio Home: Two-Column Layout for Logged-In Users

## Overview

Keep the existing Landing page at `/` for unauthenticated visitors. Create a new `Home` page that authenticated users get redirected to. This Home page has a two-column desktop layout (Sidekick chat + sidebar with Events, RT Updates, Studio Updates) and a tabbed mobile layout.

## Changes

### 1. Database: `studio_log` table

New migration to create a `studio_log` table (columns: `id`, `created_at`, `log_type` text, `title` text, `description` text, `url` text nullable). Public select RLS policy. Seed with a few initial entries describing recent Studio improvements.

### 2. Landing page redirect update

In `src/pages/Landing.tsx`, change the authenticated redirect from `/sidekick` to `/home` (line 34).

### 3. Routes (`src/App.tsx`)

- Add `/home` route → new `Home` component (protected)
- Keep `/sidekick` route but redirect to `/home`
- Keep `/` → Landing (handles auth redirect to `/home`)

### 4. Nav update (`src/components/TopNav.tsx`)

- Replace "Sidekick" nav item with "Home" pointing to `/home`
- Add "Profile" as a visible text link on desktop (alongside Library, Get Support)
- Simplify the dropdown to sign-out only

### 5. New `src/pages/Home.tsx`

Two-column layout on desktop:
- **Left (flex-1):** `<Sidekick fullPage />`
- **Right (280px, collapsible):** `<HomeSidebar />`

Mobile: tab bar switching between Sidekick, Events, and Updates.

### 6. New `src/components/HomeSidebar.tsx`

Three stacked sections:
- **RT Events:** Luma calendar iframe
- **RT Updates:** Client-side fetch of `https://updates.relationaltechproject.org/feed.xml`, parsed with DOMParser, 3 most recent items, cached in localStorage for 15 min
- **Studio Updates:** Query `studio_log` table, show 3-4 recent entries

Collapsible via a toggle button.

### 7. AI-generated studio log entries

In `chat-remix` edge function, when a contribution is saved, use Lovable AI to generate a 1-2 line description and insert into `studio_log`.

## Files Changed

| File | Change |
|------|--------|
| Migration | Create `studio_log` table + seed data |
| `src/pages/Landing.tsx` | Redirect authenticated users to `/home` |
| `src/App.tsx` | Add `/home` route, redirect `/sidekick` → `/home` |
| `src/components/TopNav.tsx` | Update nav: Home, Library, Profile, Get Support |
| `src/pages/Home.tsx` | New: two-column layout |
| `src/components/HomeSidebar.tsx` | New: Events + RT Updates + Studio Updates |
| `src/pages/SidekickPage.tsx` | Redirect to `/home` or remove |
| `supabase/functions/chat-remix/index.ts` | Insert studio_log on contribution |

## Implementation Order

1. Migration (studio_log table + seed)
2. Routes + nav restructuring
3. Home page with two-column layout
4. HomeSidebar (Luma, RSS, studio_log)
5. Mobile tab bar
6. AI-generated log entries on contribution

