# Design Contributor Guide

A working doc for designers and storytellers contributing to the Relational Tech Studio. Pairs with `README.md` (project overview) and `HACKATHON.md` (agency-building brief).

---

## 1. Aesthetic in one paragraph

The Studio is "warm craft": serif headlines (Fraunces) over a clean humanist body (Inter), set on an off-white/cream canvas with terracotta accents. It should feel handmade and neighborly — closer to a printed zine or a community library than a SaaS dashboard. No purple gradients. No generic AI shimmer. Bold typography and generous space do most of the work; motion and color are used sparingly, with intent.

---

## 2. Design system map

| File | What lives there |
|------|------------------|
| `src/index.css` | HSL color tokens, gradients, shadows, `@font-face` declarations, base layer styles |
| `tailwind.config.ts` | Token → utility mapping, `fontFamily`, custom spacing/radii |
| `src/components/ui/*` | shadcn primitives (Button, Card, Dialog, etc.) — owned in-repo, restyled via CVA variants |
| `src/components/Footer.tsx`, `TopNav.tsx` | Shared chrome on every page |

**Page surfaces most likely to be redesigned**

- `src/pages/Landing.tsx` — hero, tool gallery, "What's Inside" grid
- `src/pages/Home.tsx` — logged-in two-column dashboard (Sidekick + sidebar)
- `src/pages/Library.tsx` — full library browse
- `src/pages/Profile.tsx` — builder profile, vision board, commitments, prototypes
- `src/pages/SidekickPage.tsx` — full-screen chat
- `src/pages/Support.tsx` — Builder's Guide and Gift Build requests

**Card surfaces (high reuse)**

- `src/components/LibraryCard.tsx`
- `src/components/ToolGalleryCard.tsx`
- `src/components/StoryCard.tsx`
- `src/components/PromptCard.tsx`

---

## 3. Token rules (non-negotiable)

1. **All colors are HSL**, defined as CSS variables in `src/index.css`, then surfaced as Tailwind utilities through `tailwind.config.ts`.
2. **Never use raw color classes** in components (`text-white`, `bg-black`, `text-red-500`). Always use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.
3. **Adding a new color = add the token first**, then use it. If you find yourself reaching for a hex value inside a component, stop and go define a token.
4. Gradients and shadows that get reused belong in `index.css` as variables (`--gradient-warm`, `--shadow-soft`), not inlined.
5. Both light and dark variants must remain legible if a token is changed.

---

## 4. Typography & motion

- **Fraunces** for headings and display copy. **Inter** for body. No substitutions, no Poppins, no Inter-as-headline.
- Use the configured Tailwind families (`font-serif`, `font-sans`) rather than re-declaring `font-family` in components.
- For animation, reach for **framer-motion**. Prefer one strong, well-timed moment (a hero reveal, a card entrance) over scattered micro-interactions.
- Respect `prefers-reduced-motion` for anything beyond a fade.

---

## 5. Assets

| Asset type | Location | How to use |
|------------|----------|------------|
| Fonts, PDFs, favicons, robots.txt | `public/` | Reference by absolute path (`/Builders_Guide_RTP.pdf`) |
| Imagery imported by components | `src/assets/` | `import hero from "@/assets/hero.jpg"` so Vite hashes it |
| Custom font files | `public/` or `src/assets/fonts/` | `@font-face` in `index.css` → expose in `tailwind.config.ts` `fontFamily` |

Prefer `.jpg` for photos, `.png` only when transparency is required, `.svg` for icons and logos.

---

## 6. Guardrails — what not to touch

- **No new dashboards or orientation tours.** The product stays focused on chat + library.
- **Sidekick stays a collaborator**, not a cheerleader. No flattery copy ("I love that idea!"), no exclamation-heavy microcopy.
- **Do not edit** `src/integrations/supabase/client.ts` or `src/integrations/supabase/types.ts` — both are auto-generated.
- **Do not edit** `.env` or project-level keys in `supabase/config.toml`.
- A frontend redesign should **not** touch `supabase/functions/*` or create database migrations. If a visual change requires new content shape, raise it as a separate backend conversation.
- Tool cards in the library follow the **authenticity principle**: real photos, real voice, no AI-generated stock imagery.

---

## 7. Workflow: preview → production

There are two lanes. They coexist — pick whichever fits the change.

### Lane A — In Lovable (fastest for iterative design)

1. Prompt changes in the Lovable editor at <https://lovable.dev/projects/f5b53aa4-443c-4aa1-8a94-b5a696f8b512>.
2. Each change auto-commits to GitHub and updates the **preview URL** instantly.
3. **Frontend changes** appear in preview but are **not live** until you click **Publish → Update** in the editor.
4. **Backend changes** (edge functions, migrations) deploy automatically on save — no extra step.

### Lane B — Local IDE (better for design-system passes or asset-heavy commits)

```sh
git clone <repo-url>
cd relational-tech-studio
npm i
npm run dev
```

Work on a branch, push to GitHub, and Lovable picks the changes up in preview. Publish from the Lovable editor as in Lane A.

### URLs for reference

- **Preview:** <https://id-preview--f5b53aa4-443c-4aa1-8a94-b5a696f8b512.lovable.app>
- **Published:** <https://rtstudio.lovable.app>
- **Custom domain:** <https://studio.relationaltechproject.org>

---

## 8. Working with Sidekick (the AI builder)

When prompting the Lovable agent for design work:

- **Reference tokens, not hex values.** "Use `bg-primary` and `text-primary-foreground`" beats "use #C25B3F".
- **Reference files by path.** "In `src/pages/Landing.tsx`, restyle the hero…" is much more reliable than "redesign the homepage."
- **Use plan mode for larger redesigns.** Ask for a plan first ("plan a redesign of the Library card grid"), review, then approve. This prevents sprawl.
- **Keep design and logic separate.** Phrase requests as visual/presentation changes ("update spacing, typography, and color of the card") so the agent doesn't drift into business logic.
- **One surface at a time.** Land changes to one component or page before moving to the next — easier to review and revert.

---

## 9. Open question: the marketing site

`relationaltechproject.org` is a **separate codebase** and is not connected to this repo. Two options for keeping the visual language consistent:

1. **Bring it into Lovable** as a sibling project that shares the same tokens and font setup. Cleanest long-term, requires a one-time port.
2. **Sync visual language manually** — replicate token values and type scale by hand whenever the Studio's system changes. Lower lift, higher drift risk.

Decision deferred. Worth picking before significant marketing-site design work begins.

---

## Out of scope for this guide

- Storybook, Figma sync, or other tooling — happy to add if/when it's useful.
- Content strategy and copy guidelines — see `HACKATHON.md` and the Sidekick persona memory for tone rules.
