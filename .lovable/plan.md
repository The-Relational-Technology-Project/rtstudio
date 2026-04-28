## Goal

Fix two Sidekick behaviors by updating the system prompt in `supabase/functions/chat-remix/index.ts` (no UI or schema changes needed).

## Issue 1: Library items treated as out-of-scope

When a builder clicks "Discuss in Sidekick" on the South Australia Citizens' Jury story, Sidekick deflects ("a bit outside my main focus") even though that story is intentionally curated in the Studio library. Anything we've decided to include in the library should be fair game.

**Fix:** Add an explicit "IN-SCOPE" rule near the top of `YOUR CAPABILITIES` (around line 491):

> **Library items are always in-scope.** Every story, prompt, and tool in the Studio library has been intentionally curated by the stewards — even examples from larger civic, cooperative, or international contexts. Never tell a builder a library item is "outside your focus" or redirect them away from it. Engage with it directly: explain what's interesting about it, surface the underlying patterns, and then help the builder translate those patterns into something neighborhood-scale if they want to go in that direction.

Also soften the existing "Celebrate the small-scale, hyperlocal nature" line (line 532) so it reads as a translation lens, not a gatekeeping filter:

> Help builders see how patterns from any scale — including larger civic examples in the library — can be translated into small, hyperlocal, neighbor-scale tools.

## Issue 2: Sidekick jumps to a single solution

Today the prompt-remix flow goes straight from "gather context" → "deliver one prompt." Builders don't get to weigh alternatives.

**Fix:** Insert a new step in the `REMIX PROMPTS` / build flow (around lines 497–502 and again before the `---PROMPT_START---` delivery on line 554):

> **Before remixing or building, surface 2–3 solution paths.** Once you understand the builder's neighborhood and what they're trying to do, briefly describe 2–3 distinct directions they could take — for example, different tools from the library, different scopes (one block vs. a whole neighborhood), or different formats (digital bulletin board vs. event series vs. directory). Reference relevant library items inline using the `[LIBRARY_ITEM:...]` markers. Then ask which direction resonates before drafting a remixed prompt or offering to build a prototype. Keep this lightweight — a short paragraph or 3 bulleted options, not a long menu.

Add a matching reminder under `IMPORTANT FOR PROMPT REMIXING` (around line 547):

> Never deliver a `---PROMPT_START---` block on the first turn after the builder picks an item. Always offer a small set of paths first and confirm the direction.

## What stays the same

- No changes to the chat UI, prototype builder, library deep-linking, or Gift Build flow.
- Tone rules (no flattery, "prompt" not "template", collaborator-not-cheerleader) are unchanged.
- The single-prompt delivery format with `---PROMPT_START---` / `---PROMPT_END---` delimiters is preserved — it just happens one turn later, after the builder confirms a direction.

## Files touched

- `supabase/functions/chat-remix/index.ts` — system prompt edits only (lines ~490–560).

## How we'll verify

After deploy, re-run the South Australia Citizens' Jury "Discuss in Sidekick" flow and a fresh remix flow:
1. Sidekick should engage with the citizens' jury story directly, surface the deliberation pattern, and offer 2–3 neighborhood-scale translations rather than deflecting.
2. On any "help me build X" request, Sidekick should propose 2–3 paths with library references first, then wait for the builder to pick before producing a `---PROMPT_START---` block.

## Memory updates

Add a short core rule to `mem://index.ts` capturing both behaviors so future edits don't regress them:

> Library items are always in-scope for Sidekick. Before remixing/building, surface 2–3 solution paths and let the builder pick.