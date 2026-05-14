# Land on /home after login, refresh Studio Updates

## Problem

Two related issues:

1. **Routing.** After magic-link sign-in or finishing onboarding, builders sometimes land on `/profile` instead of `/home`. The current logic in `AuthCallback.tsx` and `Landing.tsx` infers "is onboarded?" by checking whether `display_name`, `neighborhood`, `neighborhood_description`, or `dreams` are non-empty. A builder who completed onboarding but later cleared one of those fields (or whose onboarding only set fields we don't check) gets bounced back to `/profile` every time. We already have a canonical signal — `profiles.profile_completed` — set by `ProfileOnboarding` on submit. We should use it.

2. **Studio Updates feed is stale.** The newest entry is from April 17, before the recent batch of improvements (prompt persistence for past prototypes, copyable prompt cards, designer collaboration / `DESIGN.md`, library scope rule for Sidekick, neighborhood naming, My Prototypes section, contribution interest email upgrade, README/CLAUDE.md contributor docs).

## Changes

### 1. Routing

- **`src/pages/AuthCallback.tsx`** — replace the field-presence check with `profile_completed`. Route `true` → `/home`, `false` (or missing) → `/profile`. Keep the timeout/fallback behavior; on error, fall back to `/home` (logged-in users shouldn't be dumped into onboarding by a transient query failure).
- **`src/pages/Landing.tsx`** — same swap. If `user && profile?.profile_completed` → `/home`, else `/profile`. (Confirm `AuthContext` exposes `profile_completed` on the profile object; if not, include it in the select.)
- **`src/components/ProfileOnboarding.tsx`** — change the post-submit `navigate("/")` to `navigate("/home", { replace: true })` so finishing onboarding goes straight to the chat without a Landing-page flicker.
- **`src/pages/AuthCallback.tsx` profile select** — narrow the select to just `profile_completed` (drop the four content fields we no longer read).

### 2. Studio Updates

Insert new `studio_log` rows (type `update`) for the recent work, dated to land at the top of the feed. Proposed entries (4 — the sidebar shows the latest 4):

- **Past prototype prompts unlocked** — Prompts for any prototype you've built are now visible from your profile, not just new ones.
- **Copy Prompt button** — Every Sidekick-delivered prompt now ships with a one-click copy action.
- **Designer collaboration kickoff** — Ryan Conlan joined to refine the storytelling and visual craft of Studio.
- **Sidekick names your neighborhood** — Sidekick now references known profile fields (especially neighborhood) in its first substantive reply.

If you'd rather highlight different milestones (or want different copy), say so before I run the migration — these are easy to swap.

## Technical notes

- `profiles.profile_completed` already exists and is set by `ProfileOnboarding` (line 46 of that file). No schema change needed for the routing fix.
- `studio_log` insert is a simple migration (RLS already permits public read). Ordering uses `created_at DESC`, so we let `now()` handle timestamps.
- No edge-function or backend logic changes; this is frontend + a single data migration.

## Out of scope

- No changes to `chat-remix`, no migrations beyond the `studio_log` inserts, no design-system changes.
