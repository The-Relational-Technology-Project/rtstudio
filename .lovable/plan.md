

## Goal
Make Sidekick smarter about *when* to use the builder's profile context — pull from it naturally when relevant (e.g., neighborhood-specific builds), but don't force it into every conversation or every generated prompt.

## Current state
`chat-remix` already loads the full profile (neighborhood, neighborhood_description, dreams, tech_familiarity, ai_coding_experience, local_tech_ecosystem) and injects it into the system prompt. So the data is there — Sidekick just isn't being told *how* to use it well.

## The fix
Update only the **guidance** in the system prompt in `supabase/functions/chat-remix/index.ts` so Sidekick:

1. **Treats the profile as known context** — never asks questions whose answers are already in the profile (e.g., "What's your neighborhood like?" when `neighborhood_description` exists).
2. **Pulls from it when relevant** — if the builder's request is tied to their neighborhood, community, or local context, draw on the profile naturally (street/neighborhood name, ecosystem details, dreams) instead of asking.
3. **Doesn't force it when irrelevant** — if the build is generic (e.g., "a habit tracker," "a recipe app"), don't shoehorn neighborhood details in. Stay light-touch.
4. **Carries the same judgment into generated prompts** — when writing the `---PROMPT_START---` block, only weave in profile specifics if they actually fit the build. Otherwise, keep the prompt clean and generic.

No changes to `generate-prototype`. No DB or UI changes. No new fields loaded — the profile is already in the system prompt.

## Files to change
| File | Change |
|------|--------|
| `supabase/functions/chat-remix/index.ts` | Add brief guidance to the system prompt: use profile context when relevant, never re-ask what's already in it, don't force it when off-topic |

