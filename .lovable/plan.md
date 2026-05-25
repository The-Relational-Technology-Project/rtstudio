# Fix: prototype build modal can hang silently

## What's actually wrong

Evan's account has 3 successful builds today, so the function works. His stuck-modal report matches a known failure mode: a long Anthropic non-streaming call (Opus 4.6, ~14k output tokens, 90–180s wall time) gets dropped somewhere between Anthropic → Edge runtime → browser. The function may even succeed and insert the prototype, but the HTTP response never makes it back. The frontend has no timeout, no cancel, no retry, no recovery path — so `isGenerating` stays `true` forever and the modal sits there.

## Goals

1. The modal can never hang silently — there's always an exit.
2. Reduce the rate of dropped long responses.
3. If the prototype was actually saved server-side, recover it instead of telling the user it failed.

Out of scope: changing the prototype output, the system prompt, the rate limit, the modal copy/visuals beyond what's needed for the new states.

## Changes

### 1. `supabase/functions/generate-prototype/index.ts` — stream from Anthropic

Switch the Anthropic call to `stream: true` and accumulate the SSE chunks server-side. This:
- Keeps the upstream socket warm with continuous events (no idle-drop).
- Lets us log progress + token count even on partial failures.
- Lets us detect a clean `message_stop` vs. a mid-stream disconnect and return a clearer error.

We still return a single JSON response to the browser (no SSE to the client this round — keeps `Home.tsx` simple). The edge function will be more reliable; that alone should remove most hangs.

Also add: on successful insert, log the prototype id so we can audit recoveries.

### 2. `src/pages/Home.tsx` + `PromptReviewModal.tsx` — client-side timeout and recovery

- Add a **4-minute client-side timeout** (`AbortController` + `setTimeout`) around `supabase.functions.invoke`. If it fires, we don't immediately fail — we call a new lightweight check (below) to see if the prototype landed in the DB.
- New small helper `findRecentPrototype(builderId, promptHash, sinceISO)`: queries `prototypes` for the most recent row by this builder created after the build started, matching the prompt. If found, treat the build as successful, load it, close the modal.
- If not found after timeout: show a clear error toast ("Build is taking longer than expected. It may still be running — refresh in a minute, or try again."), unblock the modal so the user can close/retry, and stop pretending the request is still in flight.
- Add a **Cancel** button to the loading state (disabled for the first 60s to avoid premature cancels, then enabled). Cancel aborts the in-flight invoke and resets `isGenerating`.

### 3. `PromptReviewModal.tsx` — loading state copy update

Tighten one line of microcopy so users know what to expect and that cancel is safe:
- "This usually takes 1–3 minutes. You can leave this tab open."
- Cancel button appears after 60s, labeled "Cancel build".

No new design language, no new components beyond the cancel button (already have `Button`).

## Out of scope / not doing

- Not switching models or shrinking `MAX_TOKENS` — Opus 4.6 is the right model and the prototypes that succeed are well-sized.
- Not adding a queue / background job — overkill for 10 builds/day/user.
- Not changing `prototypes` schema.
- Not touching any other edge function, the Sidekick prompt, contributions UX, or the public/share views.

## Risk

- Streaming code path on the edge function is new; a bug there could break builds for everyone. Mitigation: keep the request shape and response shape identical to today, so `Home.tsx` doesn't change its contract. Test once after deploy with a small prompt before declaring done.
- The "look up prototype after timeout" recovery could surface a stale row if the user changed their prompt and resubmitted within seconds. Mitigation: match on exact prompt string + `created_at >= requestStartedAt`.

## Verification

- Trigger one short build → confirm normal happy path still works.
- Trigger one large build (deliberately verbose prompt) → confirm streaming completes and prototype renders.
- Simulate timeout by lowering the client timeout to 5s in dev → confirm recovery lookup finds the row and loads the prototype instead of erroring.
- Confirm Cancel button aborts cleanly and leaves the UI in a usable state.
