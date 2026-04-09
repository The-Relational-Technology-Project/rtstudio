

# Fix Prototype Builder: Animation, Quality, CORS, and Multi-Page Navigation

## Issues Identified

1. **No build animation visible**: The `PromptReviewModal` has a nice spinner/status UI tied to `isGenerating`, but the modal closes (`setShowPromptReview(false)`) as soon as the response comes back (line 69). The problem is that `isGenerating` is correctly passed to the modal, so the animation should show. However, the modal's `onOpenChange` is set to `undefined` when generating, which may not prevent Radix from closing it. Need to verify the modal stays open during generation.

2. **CORS errors on shared prototype page**: The console screenshot shows errors loading CSS/JS from `studio.relationaltechproject.org` — this is from the *shared prototype page* (`/p/:shareId`). The iframe uses `sandbox="allow-scripts"` but lacks `allow-same-origin`. The generated HTML itself is self-contained, but the share page iframe is served from a different origin context. The CORS errors are from the parent page's assets being blocked inside the sandboxed iframe context — this is a red herring from browser devtools showing errors from the iframe's nested document trying to access parent resources.

3. **Low prototype quality**: `MAX_TOKENS` is set to **4096** — far too low for Claude Opus to generate a rich, multi-section prototype. A typical high-quality artifact needs 8000-16000 tokens. This is likely the primary cause of truncated/low-quality output.

4. **Multi-page navigation doesn't work**: The generated HTML uses anchor links (`<a href="#events">`) or separate page navigations. The iframe's `sandbox="allow-scripts"` without `allow-same-origin` blocks cookie access (visible in the screenshot). Internal navigation within a single `srcDoc` iframe works fine for hash-based routing but not for separate page URLs. The fix is to instruct Claude to use tab/section-based single-page navigation rather than multi-page links.

## Plan

### 1. Increase MAX_TOKENS for richer prototypes
**File:** `supabase/functions/generate-prototype/index.ts`

Change `MAX_TOKENS` from 4096 to 12000. This gives Claude Opus enough room to generate detailed, multi-section prototypes with proper CSS and interactivity.

### 2. Update system prompt for single-page navigation
**File:** `supabase/functions/generate-prototype/index.ts`

Add to the system prompt requirements:
- "Use tab-based or section-based navigation within a single page. All navigation should use JavaScript to show/hide sections — never use separate HTML pages or links that navigate away."
- "The entire app must work within a single HTML document displayed in a sandboxed iframe."

This ensures "Events", "Join Us", etc. all work as show/hide sections rather than broken page navigations.

### 3. Ensure build animation stays visible
**File:** `src/components/PromptReviewModal.tsx`

The current code passes `isGenerating ? undefined : onOpenChange` to prevent closing during generation. Verify this works with Radix Dialog. If not, add `onPointerDownOutside={(e) => e.preventDefault()}` and `onEscapeKeyDown={(e) => e.preventDefault()}` to `DialogContent` when generating.

### 4. Update CORS headers in edge function
**File:** `supabase/functions/generate-prototype/index.ts`

Update the CORS `Access-Control-Allow-Headers` to include the additional Supabase client headers that `functions.invoke()` sends:
```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

### 5. Add `allow-same-origin` to prototype iframe sandbox
**Files:** `src/components/PrototypePreview.tsx`, `src/pages/PrototypeShare.tsx`, `src/pages/PrototypeEmbed.tsx`

Change `sandbox="allow-scripts"` to `sandbox="allow-scripts allow-same-origin"` to prevent the cookie SecurityError shown in the console. The generated HTML is self-contained so this is safe.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-prototype/index.ts` | MAX_TOKENS 4096→12000; single-page navigation prompt; CORS headers |
| `src/components/PromptReviewModal.tsx` | Ensure modal cannot be dismissed during generation |
| `src/components/PrototypePreview.tsx` | Add `allow-same-origin` to iframe sandbox |
| `src/pages/PrototypeShare.tsx` | Add `allow-same-origin` to iframe sandbox |
| `src/pages/PrototypeEmbed.tsx` | Add `allow-same-origin` to iframe sandbox |

