# CLAUDE.md

Instructions for AI coding assistants working on the Relational Tech Studio.

## Quick reference

- **Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase
- **Dev server:** `npm run dev` (port 8080)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Path alias:** `@/` maps to `src/`

## Do not edit

- `src/integrations/supabase/client.ts` — auto-generated
- `src/integrations/supabase/types.ts` — auto-generated
- `.env` or Supabase project keys in `supabase/config.toml`

## Styling rules

All colors are HSL tokens defined in `src/index.css` and surfaced as Tailwind utilities through `tailwind.config.ts`.

- **Never use raw color classes** like `text-white`, `bg-black`, `text-red-500`. Always use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`.
- Adding a new color means adding a token in `src/index.css` first, then referencing it. No inline hex values in components.
- Fonts: **Fraunces** for headings (`font-serif`), **Inter** for body (`font-sans`). No substitutions.
- Gradients and reusable shadows go in `src/index.css` as CSS variables, not inline.
- Both light and dark variants must stay legible when changing tokens.

## Architecture

### Frontend

Routes are in `src/App.tsx`. Protected routes wrap with `<ProtectedRoute>`.

Key pages:
- `/` — `Landing.tsx` (public)
- `/home` — `Home.tsx` (Sidekick chat + sidebar, authenticated)
- `/library` — `Library.tsx` (browse the commons)
- `/profile` — `Profile.tsx` (vision board, commitments)
- `/support` — `Support.tsx` (Builder's Guide, Gift Build)

State management uses React Context:
- `AuthContext` — session, profile, sign-out
- `SidekickContext` — chat message history
- `TourContext` — onboarding tour

Data fetching uses TanStack Query (via `@tanstack/react-query`).

### Backend

Supabase Edge Functions are in `supabase/functions/`. Each is a Deno runtime.

The most important function is `chat-remix/index.ts` — it contains:
- Sidekick's system prompt and personality
- Tool definitions (submit_story, submit_prompt, submit_tool, record_commitment)
- Profile personalization and library RAG search
- Rate limiting (500 messages/day per user)

Edge functions deploy automatically when changed through Lovable. For local testing, use the Supabase CLI.

### Database

Core tables: `profiles`, `commitments`, `stories`, `prompts`, `tools`, `serviceberries`, `chat_usage`, `vision_board_pins`.

All tables use Row-Level Security. Migrations live in `supabase/migrations/`.

## Content principles

- Sidekick is a collaborator, not a cheerleader. No flattery copy ("I love that idea!"), no exclamation-heavy microcopy.
- The product stays focused on chat + library. No new dashboards or orientation tours.
- Tool cards follow the authenticity principle: real photos, real voice, no AI-generated stock imagery.
- Frontend visual changes should not touch `supabase/functions/*` or create database migrations without a separate conversation about the backend implications.

## Component conventions

- UI primitives live in `src/components/ui/` (shadcn/ui, owned in-repo, styled via CVA variants)
- Card components (`LibraryCard`, `ToolGalleryCard`, `StoryCard`, `PromptCard`) are high-reuse surfaces
- Animation uses framer-motion. Prefer one strong moment over scattered micro-interactions. Respect `prefers-reduced-motion`.
- Assets: `.jpg` for photos, `.png` only for transparency, `.svg` for icons/logos. Static assets in `public/`, imported assets in `src/assets/`.
