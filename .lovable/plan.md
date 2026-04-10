

# Upgrade Claude Model & Reorder Prototype Layout

## Changes

### 1. Upgrade Claude model to Opus 4.6
**File:** `supabase/functions/generate-prototype/index.ts`

Change line 10 from `claude-opus-4-20250514` to `claude-opus-4-20250625` (Opus 4.6). Update the comment accordingly.

### 2. Move Referenced Library Items below prototype
Currently, the "Referenced Library Items" section renders *inside* the `Sidekick` component (at the bottom). The prototype renders *after* Sidekick in `Home.tsx`. This means the actual order is:

```text
Sidekick chat
Referenced Library Items   ← inside Sidekick
Prototype                  ← in Home.tsx
```

To achieve the desired order (Sidekick → Prototype → Library Items):

**File:** `src/components/Sidekick.tsx`
- Add an optional `prototypeSlot` prop (`React.ReactNode`)
- Move the "Referenced Library Items" section to render *after* the `prototypeSlot`
- The render order inside Sidekick becomes: chat area → prompt card → `prototypeSlot` → library items

**File:** `src/pages/Home.tsx`
- Instead of rendering `<PrototypePreview>` as a sibling after `<Sidekick>`, pass it as the `prototypeSlot` prop:
  ```
  <Sidekick
    prototypeSlot={prototype ? <PrototypePreview {...prototype} /> : null}
    ...
  />
  ```
- Remove the standalone `{prototype && <PrototypePreview>}` blocks (both mobile and desktop)

This keeps widths matched automatically since everything flows inside the same container.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-prototype/index.ts` | Model `claude-opus-4-20250625` |
| `src/components/Sidekick.tsx` | Add `prototypeSlot` prop, render between prompt card and library items |
| `src/pages/Home.tsx` | Pass prototype as `prototypeSlot` instead of rendering separately |

