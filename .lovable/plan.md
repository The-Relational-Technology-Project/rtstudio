## Goal

Fix Sidekick so it visibly demonstrates it knows the builder's profile (especially their neighborhood name) before asking follow-up questions. Today, when a builder says "build a connector site for my neighborhood," Sidekick correctly loads the profile but asks generic questions like "What's the vibe of your neighborhood?" — making it feel like it has no context at all.

## Why this happens

`supabase/functions/chat-remix/index.ts` already loads the full profile (lines 148–200) and tells the model not to re-ask things that are filled in. But:

- Many profiles have `neighborhood` populated but `neighborhood_description`, `dreams`, and `local_tech_ecosystem` empty.
- The current rules tell the model not to *re-ask* known facts but don't tell it to *acknowledge* what it does know.
- So the model jumps straight to "tell me about your neighborhood" — which is reasonable (description is empty) but feels disembodied because it never named the place it does know.

## Fix (system prompt only)

Edit the `USING PROFILE CONTEXT WELL` block in `supabase/functions/chat-remix/index.ts` (around lines 194–199) to add two rules:

1. **Acknowledge known profile fields explicitly.** When a builder asks for help with something tied to their neighborhood/community, name their neighborhood (and any other populated fields that fit) in the response *before* asking for more — e.g., "For Five Points in Denver, here are a few directions…" rather than "Tell me about your neighborhood."

2. **Scope follow-up questions to actual gaps.** If `neighborhood` is set but `neighborhood_description` is empty, don't ask the broad "what's it like?" — ask the specific missing piece ("I know you're in Five Points — what's one thing about the block or building you'd want this site to reflect?"). If `dreams` is empty, ask about goals specifically. Never ask a question that pretends the whole profile is unknown.

3. **Quick reference template.** Add a short example pair showing good vs. bad first responses so the model has a concrete pattern to follow.

Also tighten the existing rule at line 195 to read: *"Treat the profile above as already known. Reference populated fields by name in your first substantive response so the builder can tell you have their context. Only ask follow-up questions about fields that are genuinely empty — and frame those questions narrowly around the missing piece, not as if you know nothing."*

## What stays the same

- Profile loading logic, schema, and field selection are unchanged.
- The 2–3 solution paths rule and library-items-always-in-scope rule from the previous update stay intact.
- No UI changes, no schema changes, no new fields.

## Files touched

- `supabase/functions/chat-remix/index.ts` — system prompt edits in the `USING PROFILE CONTEXT WELL` section only.

## How we'll verify

After deploy, sign in as a user whose profile has only `neighborhood` populated and ask "help me build a connector site for my neighborhood." Sidekick should:
1. Name the neighborhood in its first response.
2. Offer 2–3 directions (existing behavior).
3. Ask only about specifically missing context (e.g., what to highlight, who the audience is) rather than the generic "what's the vibe."

## Memory update

Add to `mem://index.md` Core: *"Sidekick must name known profile fields (especially neighborhood) in its first substantive reply and scope follow-ups to actually-empty fields."*
