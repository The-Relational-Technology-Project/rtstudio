
# Fix Duplicate Contributions, Serviceberries, and Profile Context

## Issues Found

### 1. Duplicate Prompt Entry
Two copies of "Neighborhood Deep Time Scanner" exist in the database. The AI model re-triggered the `submit_prompt` tool on a follow-up question because:
- The conversation history sent to the LLM doesn't include the tool call result -- only the hardcoded success message
- The LLM has no memory that it already submitted the prompt, so it calls the tool again
- There is no server-side deduplication check

### 2. Serviceberries Not Awarded
The edge function logs show "User not authenticated - guest mode" during both prompt submissions, even though you were signed in. The serviceberry-awarding code (line 608) correctly gates on `userId`, but since the user wasn't recognized, it was skipped entirely. Additionally, there is a profile context overwrite bug (see below) that may contribute to auth confusion.

### 3. Profile Context Overwrite Bug (lines 211-216)
This is a copy-paste error in `chat-remix/index.ts`. The code at lines 194-209 builds a full personalized profile context (name, neighborhood, dreams, tech comfort). Then lines 211-216, which should be inside an `else` block, run unconditionally and overwrite all that context with just "AUTHENTICATED USER." This means **personalization has been broken for all authenticated users**.

## Fix Plan

### Step 1: Delete the duplicate prompt
Remove the older duplicate entry (ID `8c4715c1-d5d0-4d26-a8bb-462b40b0ca12`) from the prompts table, keeping the newer one.

### Step 2: Fix the profile context overwrite bug (lines 211-216)
Move the fallback `profileContext` assignment into a proper `else` branch so it only triggers when the profile fetch fails, not unconditionally.

Before:
```text
if (profile && !profileError) {
  // ... builds full profileContext (lines 194-209)
}
// BUG: This runs ALWAYS, overwriting the above
profileContext = `AUTHENTICATED USER...`;
```

After:
```text
if (profile && !profileError) {
  // ... builds full profileContext
} else {
  // Only when no profile data
  profileContext = `AUTHENTICATED USER...`;
}
```

### Step 3: Add deduplication guard for contributions
Before inserting a contribution, check if an item with the same title already exists in the target table. If it does, skip the insert and return a message acknowledging the item already exists.

This prevents the LLM's repeat tool calls from creating duplicates, regardless of why the LLM re-triggered the call.

### Step 4: Inject tool-call history into conversation context
After a successful contribution, append a system-level note to the conversation context so the LLM knows a submission already happened. This is done by checking the `contribution` field in the response and including prior tool results when building the next request's messages.

In the Sidekick component (`Sidekick.tsx`), track contributions that have already been made in the session and append a context note to messages sent to the API:
- "NOTE: A prompt titled 'X' was already submitted to the library in this conversation. Do not submit it again."

### Step 5: Manually award missing serviceberries
Use the `award_serviceberries` database function (via direct SQL as service role) to credit 15 serviceberries for the prompt contribution that was missed.

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/chat-remix/index.ts` | Fix profile context overwrite (lines 211-216 into else block) |
| `supabase/functions/chat-remix/index.ts` | Add title-based dedup check before insert (lines 558-584) |
| `src/components/Sidekick.tsx` | Track submitted contributions and inject context note into messages |
| Database | Delete duplicate prompt `8c4715c1-d5d0-4d26-a8bb-462b40b0ca12` |
| Database | Award 15 serviceberries for the missed contribution |
