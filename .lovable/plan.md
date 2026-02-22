
# Three Changes: Nav Cleanup, Profile Reorder, and Get Support Page

## 1. Remove Serviceberries from Top Nav

Remove the `ServiceberriesCounter` from the desktop nav in `TopNav.tsx` (line 64). Serviceberries will only appear on the Profile page. Remove the unused import as well.

## 2. Add "Get Support" to Main Nav

**Nav update** (`TopNav.tsx`): Add "Get Support" to the `navItems` array with path `/support`.

**New page** (`src/pages/Support.tsx`): A simple page with `TopNav` and `Footer` containing:

- **Header**: "Get Support" with a short intro about resources for builders.
- **Builder's Guide section**: A brief description of The Builder's Spiral -- a practice guide for building technology that deepens community. CTA button: "Download the Builder's Guide" linking to the PDF file (copied into `public/`).
- **1:1 Jam Session section**: A brief description explaining that Josh, one of the stewards of the Relational Tech Project, is available for 1:1 conversations about your building journey. CTA button: "Book a Jam Session" linking to `https://cal.com/joshnesbit` (opens in new tab).

**Route** (`App.tsx`): Add a protected route for `/support`.

**PDF asset**: Copy the uploaded PDF to `public/Builders_Guide_RTP.pdf` so it can be downloaded directly.

## 3. Reorder Profile Page Sections

Rearrange the sections in `Profile.tsx` to this order:

1. Profile Header (unchanged)
2. Commitments
3. Dreams and Goals (editable)
4. Local Tech Ecosystem (editable)
5. Vision Board
6. Serviceberries
7. Tech Familiarity and AI Coding Experience (make both editable using the same `EditableSection` pattern, adapted for single-value selection)

For Tech Familiarity and AI Experience, these will become editable inline fields. Since they are short single-value fields (not freeform text), they will use a simple select/dropdown edit mode rather than a textarea -- allowing the user to pick from the same options used during onboarding.

## Technical Details

### Files modified:
- `src/components/TopNav.tsx` -- remove serviceberries, add "Get Support" nav item
- `src/pages/Profile.tsx` -- reorder sections, make tech fields editable
- `src/App.tsx` -- add `/support` route

### Files created:
- `src/pages/Support.tsx` -- new Get Support page

### Files copied:
- `user-uploads://Builders_Guide_RTP.pdf` to `public/Builders_Guide_RTP.pdf`
