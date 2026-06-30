Three changes, all driven by Deb's feedback.

## 1. Mobile chat UI fix

**Problem:** On mobile (`/` Home), the chat row is locked to `h-[60vh]` and the library aside renders directly underneath in normal page flow. Result (per screenshot): the chat messages area is squeezed to a sliver — only one message visible above the input — and the "Referenced Library Items" panel competes for screen real estate below.

**Fix in `src/pages/Home.tsx`:**
- On mobile (below `lg`), give the chat the full available viewport (`min-h-[calc(100vh-3.5rem)]`) instead of `h-[60vh]`, so the conversation reads like a normal chat app.
- Move the "Referenced Library Items" panel **inside the Sidekick component on mobile** (collapsed by default, expandable), or render it as a separate full-width section *below* the chat with a clear heading — but no longer share the same row. Preferred approach: render library items inline at the bottom of the chat scroll area on mobile (matching the existing non-fullPage Sidekick pattern), and keep the side aside only on `lg+`.
- Keep desktop layout (chat + 380px aside + build plan below) exactly as it is today.

**Fix in `src/components/Sidekick.tsx`:** when `fullPage` and on mobile, render `libraryItems` inline after the message list (the same `LibraryItemPreview` list already used in the non-fullPage branch), so the items appear in the natural scroll flow rather than competing with the chat for height.

## 2. Slow down idea → directions → build plan; make "Remix" enter conversation mode

Deb's two observations:
- Hitting Remix on Danny's tool gave three *other* directions instead of engaging with Danny's tool.
- Sidekick jumped to three options without asking why she cared (the identity/Antler angle) or what she actually wanted to learn from Danny's code.

**Fix in `src/components/LibraryCard.tsx` (`handleDiscussInSidekick`):** when remixing a *specific* library item, send a richer opening message that names the item, asks the builder to share their context, and signals to Sidekick to engage with **that item first** before branching. E.g.:

> "I want to remix \"{item.title}\" — [LIBRARY_ITEM:{type}:{id}:{title}]. Before suggesting other directions, help me understand this one: what's interesting about how it's built, and ask me about my context (what I'm trying to do, who it's for, what I'd want to keep or change) so the remix actually fits."

This keeps the original item at the center of the conversation and explicitly asks for context-gathering before branching.

**Fix in `supabase/functions/chat-remix/index.ts` system prompt (sections "OFFER 2–3 BUILD DIRECTIONS" + "EXPLORE BUILD DIRECTIONS"):** tighten the sequencing so context comes *before* options and *before* readiness:

1. Add an explicit rule: **when the user's opening message references a specific library item (a `[LIBRARY_ITEM:...]` marker is present), engage with THAT item first** — surface what's distinctive about it, ask 1–2 specific questions about the builder's context (why this one, what they want to learn or keep), and only branch into 2–3 alternative directions if/when the builder signals they want to explore beyond it. Do not immediately list three *other* tools as alternatives to the one they picked.
2. Add a "depth check" before `[READY_FOR_BUILD_PLAN]`: require at least one round of follow-up questions on the builder's specific context (neighborhood, audience, what already exists, what they've tried, what would make it feel right) after they pick a direction — not just acceptance of one of the three options. Update the example dialogue in the system prompt to model "pick a direction → one more round of context → readiness," not "pick a direction → readiness."
3. Reinforce: Sidekick should ask about the *why* and the specifics ("what drew you to this one?", "what's the part you want to learn from?") before proposing alternatives.

## 3. Let contributors submit a GitHub repo URL

Deb's wanted-to-look-at-Danny's-code use case: today the contribution form (`ContributionDialog`) has no field for a GitHub repo, so builders can't share their source even when they want to. The `tools` table already has `github_url`, `lovable_url`, and `hosted_url` columns; we just don't expose them at submission.

**Fix in `src/components/ContributionDialog.tsx`:** add three optional URL fields (GitHub repo, Lovable project, hosted/live URL) when the contribution type is a tool. Pass them through to the contribution payload.

**Fix in `supabase/functions/notify-contribution/index.ts`** (and the admin promote flow in `src/components/admin/PromoteContributionDialog.tsx`): include the submitted URLs in the email to stewards and prefill them when promoting the contribution into a real `tools` row, so Danny-style entries arrive with their repo link intact.

No DB migration needed — the columns already exist on `tools` and the contribution payload is freeform JSON.

## Out of scope
- No changes to the build plan generator itself; the "slow down" change happens entirely in the chat-remix system prompt and the remix entry point.
- No changes to auth, magic link, or email infrastructure.
- No schema changes.
