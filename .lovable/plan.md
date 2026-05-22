# Allow full-complexity prompts; render single-page previews with stub tabs

## Problem

The in-Studio prototype is technically a single HTML doc rendered in a sandboxed iframe. To fit that, our `generate-prototype` system prompt currently tells the model to use tab/section navigation within one page — which is correct for rendering, but it has bled into how Sidekick writes the *prompt itself*. Tools come out feeling small: one screen, a couple of tabs, everything functional but shallow. As tools grow (multi-role flows, admin views, onboarding, settings, detail pages), this flattens the UX builders are actually imagining for their neighbors.

We want to separate two things that have collapsed into one:

1. **The prompt** (what the builder takes to Lovable / Claude Code / their own dev) — should describe the *full* UX, including multiple pages, roles, flows, and states. No artificial single-page ceiling.
2. **The in-Studio preview** (rendered in the sandboxed iframe) — stays single HTML doc, but is allowed to *represent* multi-page structure via tabs/sections, and explicitly allowed to leave some tabs as visual stubs ("Coming soon", placeholder content, or just the nav item without a working panel).

## Changes

### 1. `supabase/functions/generate-prototype/index.ts` — `SYSTEM_PROMPT`

Reframe the single-page constraint as a *rendering* constraint, not a *design* constraint. Specifically:

- Keep: single HTML document, no external nav, hash/JS section switching only (this is the iframe constraint, non-negotiable).
- Add: "The prompt you're given may describe a tool with many pages, roles, or flows. Your job is to represent that structure within one document — not to shrink the design to fit. Use a top-level nav (tabs, sidebar, or bottom bar) that reflects every major section the prompt describes, even sections you won't fully build out."
- Add explicit permission to stub: "It is fine — encouraged, even — to leave secondary sections as visual stubs: a panel with a heading, a short description of what would live there, and maybe one or two placeholder rows. Prioritize building out the 1–2 sections most central to the builder's idea. Don't try to fully implement 6 tabs in one pass; build 2 well and stub the rest."
- Add: "If the prompt describes multiple user roles (e.g. neighbor vs. organizer vs. admin), include a simple role-switcher at the top so reviewers can see each role's view. Stubs are fine for non-primary roles."
- Keep the existing CSS-vs-JS tradeoff guidance.

### 2. `supabase/functions/chat-remix/index.ts` — Sidekick's prompt-writing guidance

Currently Sidekick writes prompts that implicitly target a single screen. Update the relevant sections of the system prompt (around lines 567–574 and wherever prompt-shape guidance lives) so that when Sidekick drafts a "remixed prompt" for the builder:

- It describes the full UX the tool needs to do its job for neighbors — including multiple pages/views, roles, and key flows — without self-censoring to fit a single screen.
- It explicitly notes (in the prompt's spec, not as meta-commentary) the primary screens and which are secondary, so any downstream builder (Lovable, Claude Code, the in-Studio prototype) knows what to prioritize.
- Add a short note to Sidekick: "The in-Studio prototype renders as a single page and will stub out secondary sections — that's expected. The prompt itself should still describe the full tool, because builders take it to other AI builders that *can* produce a multi-page app."

### 3. `PromptReviewModal.tsx` micro-copy (optional, small)

Add one line near the "Review your build prompt" subhead, something like:
> "If you build it here, the preview will show one page with the main flow working and other sections stubbed. Take the prompt to Claude Code or Lovable for the full multi-page version."

This sets expectations so builders don't think the preview is the ceiling.

## Out of scope

- No DB changes, no new tables, no new edge functions.
- No change to the iframe sandbox or `PrototypePreview.tsx` rendering.
- No change to rate limits or model choice.
- The contribution / story-nudge work from the prior thread is separate and not touched here.

## Risk

Stubs done poorly look like the model gave up. Mitigation: the prompt change tells the model to make stubs *intentional and labeled* ("This is where the directory of mutual-aid offers would live") rather than empty panels. We'll watch the next handful of generations and tighten the wording if stubs feel lazy.
