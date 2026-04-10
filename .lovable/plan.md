

# Fix: Prototype JavaScript Getting Truncated

## Problem
The generated prototype HTML is being cut off before the `<script>` block. The uploaded prototype.html is 1403 lines but ends mid-content — the entire JavaScript section (tab switching, radio button handlers, form submission, etc.) is missing. This is because `MAX_TOKENS = 12000` isn't enough for rich prototypes.

## Root Cause
Claude writes HTML/CSS first, then the `<script>` at the end. For a detailed 1400+ line prototype, 12,000 tokens runs out before the JS is written. No JavaScript = no interactivity.

## Solution

### 1. Increase MAX_TOKENS (edge function)
**File:** `supabase/functions/generate-prototype/index.ts`

Increase `MAX_TOKENS` from `12000` to `16000`. Claude Opus 4.6 supports up to 32K output tokens, so this is safe. 16K should comfortably fit even rich prototypes with full JS.

### 2. Update system prompt to prioritize JS placement
Add an instruction to the system prompt telling Claude to write the `<script>` tag early or to keep CSS concise. Specifically, add:

> "IMPORTANT: Keep your CSS concise and avoid excessive visual polish that inflates token count. The JavaScript functionality (tab switching, button handlers, form interactions) is MORE important than pixel-perfect CSS. If you must choose, cut CSS details before cutting JS functionality."

### 3. Add truncation detection (edge function)
After receiving the generated code, check if it ends with `</html>`. If not, the output was truncated. Return an error asking the user to simplify their prompt, rather than serving a broken prototype.

```
if (!generatedCode.trimEnd().endsWith('</html>')) {
  return new Response(
    JSON.stringify({ error: 'The prototype was too complex and got cut off. Try simplifying your prompt or breaking it into smaller pieces.' }),
    { status: 422, ... }
  );
}
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-prototype/index.ts` | Increase MAX_TOKENS to 16000, add CSS-economy note to system prompt, add truncation detection |

