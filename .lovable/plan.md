

# Home Page Fixes: Sidebar Toggle, Events Embed, and Network Update Summaries

## Changes

### 1. Bigger sidebar toggle button
**File:** `src/pages/Home.tsx` (lines 76-82)

Replace the tiny `»`/`«` text button with a proper icon button using `ChevronRight`/`ChevronLeft` from lucide-react. Larger hit target (~32x32px), rounded, with hover background. Vertically centered on the sidebar edge.

### 2. Fix RT Events calendar embed
**File:** `src/components/HomeSidebar.tsx` (lines 73-79)

Replace the old Luma embed URL with the new one provided:
- Old: `https://lu.ma/embed/calendar/cal-FCvnRdKnHkfRb5u/events`
- New: `https://luma.com/embed/calendar/cal-nic0320bsY3RbWC/events`

Also increase iframe height slightly (280 → 350) to better show upcoming events.

### 3. AI-summarized Network Updates descriptions
**File:** `src/components/HomeSidebar.tsx`

The RSS feed items have a `description` field that currently isn't displayed. We'll add a new edge function `summarize-feed` that:

1. Accepts an array of RSS item descriptions
2. Calls Lovable AI (gemini-2.5-flash-lite — fast and cheap) to produce a plain-language 1-line summary for each
3. Returns the summaries

The `RTUpdatesSection` component will:
1. Fetch RSS as before
2. Call the `summarize-feed` edge function with the raw descriptions
3. Display the AI summary below each item title
4. Cache the summaries alongside the RSS items in localStorage (same 15-min cache)

This keeps the AI call server-side (edge function) and avoids exposing API keys client-side. The summaries get cached so repeat visits don't re-call the AI.

### Edge function: `supabase/functions/summarize-feed/index.ts`

Accepts `{ descriptions: string[] }`, calls Lovable AI with a system prompt like "Summarize each GitHub update in one plain-language sentence. No jargon. Focus on what changed and why it matters for neighborhoods." Returns `{ summaries: string[] }`.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Home.tsx` | Larger, more visible sidebar toggle button |
| `src/components/HomeSidebar.tsx` | New Luma URL; display AI summaries below titles |
| `supabase/functions/summarize-feed/index.ts` | New edge function for AI summarization |

