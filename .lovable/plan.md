

# Sidekick UX Improvements from Demo Feedback

## Phase 1: Quick Wins

### 1. Make tool card images clickable
**File:** `src/components/LibraryCard.tsx` — add `onClick` and `cursor-pointer` to the image wrapper to open the detail dialog.

### 2. Remove sycophantic openers from system prompt
**File:** `supabase/functions/chat-remix/index.ts` — add to YOUR STYLE:
```
- Never open with flattery like "I love that idea!" or "Great question!" — jump straight into being helpful.
```

### 3. Ban the word "template"
**File:** `supabase/functions/chat-remix/index.ts` — add to YOUR STYLE:
```
- Never use the word "template" — say "prompt" or "starting point"
```

### 4. Reword welcome buttons for clarity
**File:** `src/components/Sidekick.tsx` — change labels and auto-fill messages:
- "Remix Something" → "Customize a tool for my neighborhood"
- "Discover Stories" → "Read neighbor stories"
- "Explore Tools" → "Browse neighborhood tools"
- "Contribute" stays, message unchanged
- Welcome text: "What are we crafting today?" → "What would you like to explore?"

## Phase 2: Prompt Copy & Builder Links

### 5. Prompt delimiters + "Copy Prompt" button + builder tool links

**a) System prompt** — instruct Sidekick to wrap final prompts:
```
---PROMPT_START---
[the complete prompt]
---PROMPT_END---
```
After the prompt, include: "You can paste this prompt into one of these AI builder tools to start building."

**b) Frontend** — detect `---PROMPT_START---` / `---PROMPT_END---` in assistant messages. When found, render:
- The prompt in a visually distinct card with a **"Copy Prompt"** button
- Three linked buttons below the prompt block:
  - **Lovable** → `https://lovable.dev`
  - **Claude Code** → `https://claude.ai/code`
  - **Dyad** → `https://dyad.sh`
- Label: "Paste your prompt into any of these to start building"
- If no delimiters found, render normally (current behavior)

## Phase 3: Conversation Management

### 6. "New Chat" button + system prompt nudge
**File:** `src/components/Sidekick.tsx` — add a "New Chat" button in the header (visible when messages exist) that calls `clearMessages()`.

**File:** `supabase/functions/chat-remix/index.ts` — add to YOUR STYLE:
```
- If the conversation shifts to a different topic, suggest starting a fresh chat.
```

## Deferred (noted for future)

- Follow-up nudge / email after prompt delivery (needs pg_cron + email infra)
- Save conversations to profile like Claude Projects (needs new table + UI)
- Admin portal mention in walking tour tool description (database content update)

## Files Changed

| File | Change |
|------|--------|
| `src/components/LibraryCard.tsx` | Make image clickable |
| `src/components/Sidekick.tsx` | Reword welcome/buttons; New Chat button; prompt-block copy UI with Lovable/Claude Code/Dyad links |
| `supabase/functions/chat-remix/index.ts` | Anti-sycophancy; no "template"; prompt delimiters; fresh-convo nudge |

