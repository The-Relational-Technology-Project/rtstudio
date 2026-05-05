# Design Contributor Guide

Create a single new file, `DESIGN.md`, at the repo root. It's the onboarding doc for Ryan (and any future design collaborator) covering the design system, file map, and how to ship changes to production. No code changes, no token changes — documentation only.

## Why

Ryan needs a single source of truth for: where to edit visuals, how the token system works, what's off-limits, and how a design tweak gets from preview to `studio.relationaltechproject.org`.

## File to create

`DESIGN.md` (repo root, alongside `README.md` and `HACKATHON.md`)

## Sections

1. **Overview** — One-paragraph framing: warm-craft aesthetic, Fraunces + Inter, terracotta/cream palette, no generic AI look.
2. **Design system map**
   - `src/index.css` — HSL tokens, gradients, shadows, font-face
   - `tailwind.config.ts` — token → utility mapping, font families
   - `src/components/ui/*` — shadcn primitives; restyle via CVA variants, don't fork
   - Page surfaces most likely to be redesigned: `Landing.tsx`, `Home.tsx`, `Library.tsx`, `Profile.tsx`, `SidekickPage.tsx`, `TopNav.tsx`, `Footer.tsx`
   - Card surfaces: `LibraryCard.tsx`, `ToolGalleryCard.tsx`, `StoryCard.tsx`, `PromptCard.tsx`
3. **Token rules** (the non-negotiables)
   - All colors HSL, defined in `index.css`, surfaced through `tailwind.config.ts`
   - Never use raw Tailwind colors (`text-white`, `bg-black`) in components — always semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.)
   - Adding a new color = add token first, then use it
4. **Typography & motion**
   - Fraunces for display/headings, Inter for body — no substitutions
   - framer-motion for any meaningful animation; prefer one strong moment over scattered micro-interactions
5. **Assets**
   - Static (fonts, PDFs, favicons) → `public/`
   - Imagery imported by components → `src/assets/`, imported as ES modules
   - Custom fonts: drop file → `@font-face` in `index.css` → expose in `tailwind.config.ts`
6. **Guardrails / what not to touch**
   - No new dashboards or orientation tours
   - Sidekick stays a collaborator (no flattery copy)
   - Don't edit `src/integrations/supabase/client.ts` or `types.ts`
   - Frontend redesign work shouldn't touch `supabase/functions/*` or migrations
7. **Workflow: preview → production**
   - **Lane A (in Lovable):** prompt → auto-commits to GitHub → preview updates instantly → click **Publish → Update** to push frontend live
   - **Lane B (local IDE):** clone repo → `npm i` → `npm run dev` → branch → push → preview reflects → publish from Lovable
   - Backend (edge functions, migrations) deploys automatically; frontend requires the Publish click
   - Preview URL, published URL, and custom domain listed for reference
8. **Working with Sidekick (the AI builder)**
   - How to phrase design prompts (reference tokens, not hex values; reference component files by path)
   - Use plan mode for larger redesigns
9. **Open question: marketing site**
   - `relationaltechproject.org` is a separate codebase. Two options noted: (a) bring it into Lovable as a sibling project sharing tokens, or (b) sync visual language manually. Decision deferred.

## Out of scope

- No changes to tokens, components, or copy
- No changes to the marketing site
- No new tooling (Storybook, Figma sync, etc.) — can be a follow-up if Ryan wants it
