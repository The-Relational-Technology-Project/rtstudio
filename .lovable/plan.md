

# Fix: Dynamic Event Count for Collapsible Events Section

## Problem

The Luma iframe is sandboxed — we can't read event count from it. A hardcoded "2 upcoming" would go stale immediately.

## Options

1. **Fetch Luma's public iCal/API feed** — Luma exposes a public `.ics` feed for calendars. We can fetch `https://luma.com/calendar/cal-nic0320bsY3RbWC/export.ics`, parse it, and count events with dates ≥ today. This gives a real count.

2. **Just say "Upcoming events"** without a count — simpler, always accurate, no external fetch needed.

3. **Fetch Luma's embed page HTML** and try to extract event count — fragile, could break anytime.

## Recommendation

**Option 1** is the most robust. We'll fetch the iCal feed client-side (it's public, no auth needed), parse it lightly to count future events, cache the count in localStorage for 15 minutes alongside the RSS cache. The collapsed header then shows "RT Events — 3 upcoming" with a real number.

If the iCal feed turns out to be blocked by CORS (likely), we fall back to **Option 2** ("Upcoming events" without a count) — still clean and honest.

A third hybrid: proxy the iCal fetch through a tiny edge function to avoid CORS, cache the count there. This guarantees the count works.

## Plan

### File: `src/components/HomeSidebar.tsx`

- Make `EventsSection` stateful with `expanded` (default: collapsed) and `eventCount`
- On mount, try fetching the Luma iCal feed via a new edge function `luma-event-count`
- Collapsed: show "RT Events — N upcoming" (or "Upcoming events" if count unavailable)
- Expanded: show the Luma iframe (height reduced to ~300px)
- Cache count in localStorage for 15 min

### File: `supabase/functions/luma-event-count/index.ts` (new)

- Fetch `https://luma.com/calendar/cal-nic0320bsY3RbWC/export.ics`
- Parse VEVENT blocks, count those with DTSTART ≥ today
- Return `{ count: N }`
- Simple, no API key needed

### File: `src/pages/Home.tsx`

- Add spacing between toggle button and sidebar content

## Files Changed

| File | Change |
|------|--------|
| `src/components/HomeSidebar.tsx` | Collapsible events with dynamic count; RSS card hierarchy swap |
| `src/pages/Home.tsx` | Spacing fix |
| `supabase/functions/luma-event-count/index.ts` | New: fetch iCal, return upcoming event count |

