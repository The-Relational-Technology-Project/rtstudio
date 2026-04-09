
# Fix prototype auth, prompt handoff, and Sidekick scrolling

## What I found

- The prototype request path is inconsistent with the rest of the app:
  - `chat-remix` uses the built-in functions client and a proven auth pattern.
  - `Home.tsx` calls `generate-prototype` with a manual `fetch`, while the function uses its own auth check.
- The prompt finalization window is not really syncing with the latest Sidekick prompt:
  - `PromptReviewModal` initializes local state once.
  - Because the modal is controlled by the parent, its `onOpenChange` handler does not run when Home opens it, so the textarea can stay stale/empty.
- The page jump is coming from `Sidekick.tsx` calling `scrollIntoView({ block: "start" })` on every new message, which scrolls the whole page instead of just the chat pane.

## Plan

### 1. Fix the recurring “Authentication failed” on Build It
**Files:** `src/pages/Home.tsx`, `supabase/functions/generate-prototype/index.ts`

- Replace the manual `fetch` calls in `Home.tsx` with `supabase.functions.invoke("generate-prototype")` for both build and refine.
- Update `generate-prototype` to use the same reliable auth-validation approach as the rest of the backend:
  - use the standard backend anon key variable
  - validate the bearer token explicitly
  - keep the existing per-user build limit and storage flow
- Add clearer 401/error branches so future auth failures are easier to diagnose.

### 2. Make the prompt auto-populate correctly in the Build It modal
**Files:** `src/components/PromptReviewModal.tsx`, `src/pages/Home.tsx`

- Keep passing the Sidekick-generated prompt from `Home.tsx` as it does now.
- Fix the modal so `editedPrompt` syncs whenever:
  - a new prompt is passed in
  - the modal opens
- This ensures the exact Sidekick prompt appears in the finalization window every time.

### 3. Clean up the prompt-card UX in Sidekick
**File:** `src/components/Sidekick.tsx`

- Keep the current prompt-card structure:
  - **Build it**
  - **Copy**
  - links to Lovable, Claude Code, and Dyad
- Remove the `"(10 left today)"` text from the Build It button.
- Keep the daily remaining count only in the modal, where the user is finalizing the prompt.

### 4. Improve the language in the Build It modal
**File:** `src/components/PromptReviewModal.tsx`

- Update the helper copy to be more encouraging and clearer, e.g.:
  - this prompt came from your Sidekick conversation
  - make any tweaks before the prototype is created
- Keep the remaining-build count visible below the textarea.

### 5. Stop the Sidekick page from jumping on every response
**File:** `src/components/Sidekick.tsx`

- Remove the current `scrollIntoView` behavior.
- Replace it with scrolling inside the messages container only.
- Only auto-scroll when a new assistant response is added.
- Position the chat pane so the newest assistant reply starts near the top of the chat viewport, letting the user read downward naturally without moving the whole page.

## Files to update

- `src/pages/Home.tsx`
- `src/components/PromptReviewModal.tsx`
- `src/components/Sidekick.tsx`
- `supabase/functions/generate-prototype/index.ts`

## Technical notes

```text
Current issue:
page scrolls to latest message element

Desired behavior:
page stays still
chat pane scrolls internally
latest assistant response starts near top of chat pane
user reads downward from there
```

- No database migration is needed for this round.
- I do not think this needs a route-level scroll fix in `App.tsx`; the jump is local to Sidekick’s message-scrolling logic.

## Acceptance checks

1. Clicking **Build it** no longer shows the auth failure toast.
2. The Build It modal opens with the Sidekick-generated prompt already filled in.
3. The modal copy encourages small edits before building.
4. The prompt-card button simply says **Build it**.
5. New Sidekick replies no longer scroll the entire page.
