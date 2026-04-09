

# Fix Prototype Builder: Auth + Prompt-Aware Build Button

## Issues

1. **Auth failure (401)**: The edge function reads `SUPABASE_ANON_KEY` from env but the secret is named `SUPABASE_PUBLISHABLE_KEY`. The `createClient` call on line 58 gets `null` for the anon key, causing auth to fail.

2. **"Build it" button shows too early**: Currently appears after 3+ user messages regardless of whether a prompt has been generated. Should only appear when a `---PROMPT_START---` delimited prompt exists in the conversation.

3. **Prompt block UX needs restructuring**: The prompt card should offer two clear actions: "Build it" (prototype in Studio) and "Copy" (for external builders). The current layout has Copy Prompt + external links but no Build button inline.

## Changes

### 1. Fix auth in edge function
**File:** `supabase/functions/generate-prototype/index.ts`

Change line 43 from `SUPABASE_ANON_KEY` to `SUPABASE_PUBLISHABLE_KEY`:
```typescript
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
```

### 2. Show "Build it" only when a prompt exists
**File:** `src/components/Sidekick.tsx`

- Remove the standalone "Build it" button block (lines 424-448) that triggers after 3+ user messages.
- Instead, add "Build it" as a primary action inside the prompt card (the `parsed.prompt` block, lines 361-390).
- Restructure the prompt card actions:
  - **Build it** button (primary, calls `onBuildIt` with the parsed prompt text) with remaining count
  - **Copy** button (outline, copies prompt to clipboard)
  - Below: "Or paste into:" row with Lovable, Claude Code, Dyad links

### 3. Pre-fill PromptReviewModal with Sidekick prompt
**File:** `src/pages/Home.tsx`

The `handleBuildIt` callback already sets `pendingPrompt` and opens the modal. Since we now pass the actual delimited prompt (not a user-message summary), the modal will show the correct prompt for editing.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-prototype/index.ts` | Fix env var name for anon key |
| `src/components/Sidekick.tsx` | Move "Build it" into prompt card; remove standalone button |

