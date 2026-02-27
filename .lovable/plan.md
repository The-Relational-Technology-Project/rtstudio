

# Rethink Onboarding: Replace "Join" Step with Prosocial Network Explainer

## Overview

Replace the final "Join the Relational Tech Network" onboarding step with a welcoming explainer about what builders get as part of the Studio network. Move it earlier in the flow -- before "About You" -- so builders understand the offerings before filling out their profile.

## New Step Order

1. **Welcome** (unchanged)
2. **Network** (NEW - replaces "join") -- simple explainer of prosocial offerings
3. **About You** (unchanged)
4. **Dreams** (unchanged)
5. **Tech Comfort** (unchanged, becomes final step with "Complete Profile" button)

## New "Network" Step Content

- **Icon:** Users icon (reuse existing)
- **Heading:** "You're Not Building Alone"
- **Subtitle:** "As part of the Studio, you're connected to a growing network of relational technologists."
- **Offerings list (friendly bullets):**
  - 1:1 support and coaching calls with RTP stewards (bookable through Get Support)
  - Connections to other builders who opt in
  - Calendar of events, huddles, and workshops -- join when you can
  - A Signal chat with local relational technologists (join through Get Support)
- **Single "Next" button** -- informational only, no external links, no skip

## Technical Changes

**File:** `src/components/ProfileOnboarding.tsx`

1. Change the `Step` type from `"welcome" | "about" | "dreams" | "tech" | "join"` to `"welcome" | "network" | "about" | "dreams" | "tech"`
2. Update the `steps` array to `["welcome", "network", "about", "dreams", "tech"]`
3. Add the new "network" step JSX (informational, no external links)
4. Move the "Complete Profile" / submit logic to the "tech" step (last step), replacing "Next" with a "Complete Profile" button that calls `handleComplete`
5. Remove the old "join" step and its external link to `relationaltechproject.org/join`

