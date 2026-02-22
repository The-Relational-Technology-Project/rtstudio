

# Serviceberries as a Visual Berry Bunch

## Concept

Replace the numeric points system with a visual, nature-inspired display. Each type of contribution earns a distinctly colored berry. Instead of seeing "45 points," you see a growing cluster of colored berries -- a visual record of the different ways you've given to and received from your community.

## Berry Color Mapping

Each contribution type gets its own berry color:

| Contribution | Color | Meaning |
|---|---|---|
| Profile setup | Amber/gold | Planting your roots |
| Commitment completed | Deep green | Following through |
| Story shared | Warm rose/pink | Sharing your experience |
| Prompt shared | Violet/purple | Offering imagination |
| Tool shared | Sky blue | Building for others |
| Commitment made | Soft sage | Setting intentions |

## Visual Design

**Nav button (small):** Instead of a cherry icon + number, show a tiny cluster of 3-5 colored dots representing the most recent berry types earned. If you only have one type, it's a single-color cluster. If you have four types, four colors appear. Clicking opens the detail dialog.

**Profile view (large):** A decorative bunch of berries arranged in a natural, organic cluster. Each berry is a small filled circle in its type's color. Berries cluster together by type, creating a visual "harvest" that grows as you contribute. Below the bunch, a simple legend shows what each color means.

**Dialog / detail view:** Replace the numeric total banner with the berry bunch visual. The activity list replaces "+10" with a small colored berry dot next to each entry, reinforcing the color = type association. No numbers anywhere.

**Empty state:** "Complete your profile to gather your first serviceberry!" with a single outline berry.

## Technical Changes

### 1. `src/components/ServiceberriesCounter.tsx` -- Full rewrite

- Remove numeric `total` state; instead compute a `Map<reason, count>` from the history
- Create a `BERRY_COLORS` config mapping each reason to a tailwind color class
- Create a `BerryBunch` component that renders SVG circles arranged in a natural cluster pattern
  - Takes the reason-to-count map as input
  - Renders colored circles, grouped by type, with slight random-feeling offsets for an organic look
  - Scales the number of visible berries (e.g., 1 berry per award, capped at ~5 per type for visual clarity)
- Nav variant: render a compact `BerryBunch` (small, ~20px) as the trigger button
- Profile variant: render a larger `BerryBunch` (~120px) with a color legend below
- Dialog content: show the bunch at medium size, the legend, and the activity list with colored dots instead of "+N"

### 2. `src/components/CommitmentsList.tsx` -- Minor update

- Change the toast message from "You earned 10 serviceberries" to something like "You gathered a serviceberry for following through"

### 3. `src/components/ProfileOnboarding.tsx` -- Minor update

- Update any toast/success message to match the new language (no numbers)

### 4. No database changes needed

The existing `serviceberries` table with `reason` and `amount` fields works as-is. We simply shift the UI from summing amounts to counting and coloring by reason. The `amount` field becomes less important visually but stays for potential future use.

