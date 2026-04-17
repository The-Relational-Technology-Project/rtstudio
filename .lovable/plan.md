

## Goal
Let builders attach up to 2 reference images (visual/aesthetic direction) when sending a prompt to the prototype builder. Images are resized client-side, sent once with the initial Claude call, and used to ground the generated prototype's look & feel.

## Where this fits

The prototype builder flow:
1. Sidekick writes a prompt in chat (`chat-remix`).
2. Builder hits "Build a prototype" → opens `PromptReviewModal`.
3. Modal calls `generate-prototype` edge function → Claude Opus → returns HTML.

Reference images attach at step 2 (the review modal), travel with the prompt to `generate-prototype`, and get included as `image` content blocks in the Anthropic Messages API call.

Images are NOT added to Sidekick chat. This is purely a "visual reference for the build" feature, surfaced in the review modal where the builder is already polishing the prompt before building.

## Plan

### 1. Add image upload UI to `PromptReviewModal`
**File:** `src/components/PromptReviewModal.tsx`

- Add a "Visual references (optional, up to 2)" section below the prompt textarea.
- File input accepts images only, max 2 files. Show thumbnails with remove buttons.
- On select: resize client-side to max 1000px wide JPEG (~80% quality) using a canvas, then convert to base64 data URL. Keep both the data URL (for preview) and the raw base64 + media type (for the API call).
- Pass `referenceImages: [{ mediaType, base64 }]` into the existing `generate-prototype` invocation alongside the prompt.

Helper: a small `resizeImageToBase64(file, maxWidth)` utility (inline in the modal or `src/lib/image.ts`) that draws the file to a canvas, scales proportionally if wider than `maxWidth`, and returns `{ mediaType: 'image/jpeg', base64 }`.

### 2. Pass images through to the edge function
**File:** `src/components/PromptReviewModal.tsx` (the `supabase.functions.invoke('generate-prototype', ...)` call)

Add `referenceImages` to the request body. Empty array if none.

### 3. Include images in the Claude call
**File:** `supabase/functions/generate-prototype/index.ts`

- Accept `referenceImages` in the request body (validate: array, max 2, each has `mediaType` in allowed set [`image/jpeg`, `image/png`, `image/webp`, `image/gif`], and `base64` is a non-empty string under a sane size limit — e.g., reject if base64 length > ~7MB which is roughly Anthropic's 5MB decoded limit).
- Build the user message `content` array as: `[...imageBlocks, { type: 'text', text: prompt }]` where each image block is `{ type: 'image', source: { type: 'base64', media_type, data } }`.
- Append a short note to the system prompt when images are present: *"The user attached reference image(s) for visual/aesthetic direction. Use them to inform colors, typography feel, layout vibe, and overall mood — they're inspiration, not a literal spec. Don't try to recreate the images pixel-for-pixel."*
- Single-turn call (no conversation persistence in this function), so images go in the one and only user message — matches the user's note about images staying in context for the whole conversation.

### 4. Light validation & UX
- Reject files > ~10MB before resize (clear toast: "Image too large, try one under 10MB").
- Reject non-image MIME types.
- Show a small "Resizing…" state while the canvas work happens (it's fast but worth a loading indicator).
- Image previews are thumbnails (~80px) with an X to remove.

## Files to change

| File | Change |
|------|--------|
| `src/components/PromptReviewModal.tsx` | Add image upload UI (max 2), client-side resize to 1000px JPEG base64, pass `referenceImages` to edge function |
| `src/lib/image.ts` *(new, optional)* | Small `resizeImageToBase64` helper — or inline it in the modal |
| `supabase/functions/generate-prototype/index.ts` | Accept `referenceImages`, validate, prepend as `image` content blocks in the Claude Messages API call, add a short system-prompt note when present |

## Out of scope
- No persistent storage of reference images (they're sent once, not saved to a bucket). Cheaper, simpler, and matches the ephemeral "this build only" intent. Can revisit if builders want to reuse references across builds.
- No images in Sidekick chat.
- No changes to `chat-remix`, profile, or library.

