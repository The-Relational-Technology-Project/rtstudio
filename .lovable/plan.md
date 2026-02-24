
# Add "Use Your Own Words and Images" Guidance to Sidekick

## What This Changes

When Sidekick delivers a remixed prompt to a builder, it will also recommend that they:
1. Write their own copy (don't use AI-generated text)
2. Use their own images (don't use AI-generated images)

This reinforces the relational tech principle of authenticity -- tools built by neighbors should sound and look like them.

## Technical Details

**File:** `supabase/functions/chat-remix/index.ts`

Update the "IMPORTANT FOR PROMPT REMIXING" section (around line 476) to add two new bullet points:

```
IMPORTANT FOR PROMPT REMIXING:
- Don't rush to deliver the prompt - gather context first
- The final prompt you deliver should be a complete prompt ready for an AI builder
- Always acknowledge the specific context they share about their neighborhood
- Gently remind them that the tool will likely change and that's okay
- After delivering a remixed prompt, recommend that the builder write their own copy rather than using AI-generated text. Their voice and their neighbors' voices are what make the tool feel real.
- Also recommend they use their own photos and images rather than AI-generated ones. Real images of their neighborhood and neighbors build trust and connection.
```

This is a system prompt change only -- no frontend or database changes needed. The edge function will redeploy automatically.
