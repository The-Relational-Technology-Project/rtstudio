

# Prototype Builder for RT Studio

## Overview

Add a "Build it" capability to Sidekick: after a builder develops a tool idea through conversation, they can generate a live clickthrough prototype (single-page HTML) rendered in an iframe on the Home screen. Prototypes can be shared via public URLs, downloaded, embedded, and refined iteratively.

## Architecture

```text
Sidekick chat (existing)
  └─ "Build it" button (after 3+ exchanges)
       └─ Prompt review/edit modal
            └─ Edge Function: generate-prototype
                 ├─ Calls Anthropic Claude API
                 ├─ Stores result in prototypes table
                 ├─ Checks rate limit (10/day/builder)
                 └─ Returns generated HTML

Home layout (top to bottom):
  1. PrototypePreview (new, only when prototype exists)
  2. Sidekick chat (existing)
  3. Library items (existing)
```

## Database

### New table: `prototypes`
- id, builder_id (uuid, no FK to auth.users), prompt, generated_code, model, tokens_used, created_at, is_shared, share_id (unique), share_view_count, tool_name, refinement_of (self-ref)
- RLS: builders can SELECT/INSERT their own; public can SELECT where is_shared = true (for share pages)

### New table: `prototype_counter`
- Single-row table tracking total prototypes built (simple counter as requested)

## Edge Function: `generate-prototype`

- Accepts `{ prompt, refinementOf?, currentCode? }`
- Validates JWT, extracts builder_id
- Checks daily rate limit (count from prototypes table where builder_id and created_at > today): max 10/day
- Calls Anthropic Messages API with Claude Opus (model stored as config variable for easy switching)
- Uses the system prompt from the spec (neighborhood-focused, self-contained HTML, mobile-friendly, warm aesthetic)
- Stores result in `prototypes` table
- Increments the prototype counter
- Returns `{ code, model, usage, prototypeId }`
- Requires `ANTHROPIC_API_KEY` secret (will ask you to provide it)

## New Components

### `PrototypePreview.tsx`
- Renders generated HTML in sandboxed iframe (`sandbox="allow-scripts"`)
- Auto-sizes height (min 400px, max 700px)
- Entrance animation: fade + slide up, ~400ms
- Collapse/minimize button
- Action buttons row:
  - **Share with neighbors** — saves share_id, copies public URL, opens share dialog
  - **Download code** — downloads as `[tool-name]-prototype.html`
  - **Download prompt** — downloads prompt as `.txt`
  - **Embed** — shows copyable iframe snippet
  - **Refine** — text input for refinement instructions, triggers new generation with original prompt + refinement + current code as context

### `PromptReviewModal.tsx`
- Shows AI-generated summary prompt from conversation
- Builder can edit before confirming
- Shows remaining builds for the day
- Confirm triggers generation

## Public Share Pages

### Route: `/p/:shareId`
- Public page (no auth required), renders prototype full-width in iframe
- Small banner: "[Builder name] is prototyping a neighborhood tool — Built with Relational Tech Studio" with link back to Studio
- Increments view_count on load

### Route: `/p/:shareId/embed`
- Clean iframe render without banner, for external embedding

## Sidekick Integration

- Add state for prototype data in Sidekick context or lifted to Home
- "Build it" button appears after 3+ user messages in conversation
- Button shows remaining daily builds (e.g., "8 of 10 remaining")
- On click: Sidekick generates a summary prompt from conversation context (via existing chat-remix function with a special mode), then opens PromptReviewModal
- After generation: prototype preview animates into view above chat

## Implementation Order

1. Ask for Anthropic API key via `add_secret`
2. Migration: create `prototypes` and `prototype_counter` tables with RLS
3. Edge function: `generate-prototype`
4. Components: `PrototypePreview`, `PromptReviewModal`
5. Sidekick integration: "Build it" button + prompt generation
6. Home page layout: prototype preview above Sidekick
7. Public share pages: `/p/:shareId` and `/p/:shareId/embed`
8. Mobile responsiveness for all new UI

## Files Changed

| File | Change |
|------|--------|
| Migration | Create `prototypes` + `prototype_counter` tables |
| `supabase/functions/generate-prototype/index.ts` | New: Anthropic API call, rate limiting, storage |
| `src/components/PrototypePreview.tsx` | New: iframe preview + action buttons |
| `src/components/PromptReviewModal.tsx` | New: prompt review/edit before generation |
| `src/components/Sidekick.tsx` | Add "Build it" button, prompt summary logic |
| `src/pages/Home.tsx` | Add PrototypePreview above Sidekick |
| `src/pages/PrototypeShare.tsx` | New: public share page |
| `src/pages/PrototypeEmbed.tsx` | New: clean embed page |
| `src/App.tsx` | Add `/p/:shareId` and `/p/:shareId/embed` routes |
| `supabase/config.toml` | Add generate-prototype function config |

## Notes

- The doc specifies Claude Opus (`claude-opus-4-20250514`). Since this requires Anthropic's API directly (not available via Lovable AI gateway), we'll need your Anthropic API key as a secret.
- The prototype counter you mentioned will be a simple table that increments on each generation — could be displayed in Studio Updates or the sidebar.
- Rate limiting uses the `prototypes` table itself (count today's rows per builder) rather than a separate rate limit table.

