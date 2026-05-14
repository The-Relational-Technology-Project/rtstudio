# Relational Tech Studio

An AI-powered platform helping neighbors create technology for community care. Built by the [Relational Technology Project](https://relationaltechproject.org/).

**Live at [studio.relationaltechproject.org](https://studio.relationaltechproject.org)**

## What is this?

The Studio is a place where neighbors can discover, remix, and contribute community technology — stories, prompts, tools, and prototypes — guided by **Sidekick**, an AI chat assistant designed to be a springboard into the neighborhood, not a destination.

Core features:

- **Sidekick** — AI chat that helps you explore the library, remix prompts, contribute stories, and make commitments to take action in your neighborhood
- **Library** — A shared commons of community stories, prompt templates, and tool recommendations
- **Profile & Vision Board** — Track your dreams, commitments, and contributions
- **Prototypes** — Build and share neighborhood tech prototypes

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| Data fetching | TanStack Query |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| AI | Lovable AI Gateway (Gemini) with tool-calling |
| Hosting | Lovable Cloud / Vercel |

## Local development

Prerequisites: Node.js 18+ (install via [nvm](https://github.com/nvm-sh/nvm))

```sh
git clone https://github.com/The-Relational-Technology-Project/rtstudio.git
cd rtstudio
npm install
npm run dev
```

The dev server runs at `http://localhost:8080`.

### Environment variables

The repo includes a `.env` with the public Supabase anon key (safe to commit). No additional env setup is needed for frontend development. Edge functions use secrets managed through the Supabase dashboard.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build locally |

## Project structure

```
src/
  pages/           # Route-level components
    Landing.tsx     # Public landing page (/)
    Home.tsx        # Logged-in dashboard with Sidekick (/home)
    Library.tsx     # Browse the commons (/library)
    Profile.tsx     # User profile, vision board, commitments (/profile)
    Support.tsx     # Builder's Guide and Gift Build requests (/support)
    Auth.tsx        # Sign in / sign up (/auth)
  components/
    Sidekick.tsx    # AI chat interface
    LibraryCard.tsx # Reusable library item card
    TopNav.tsx      # Navigation header
    Footer.tsx      # Site footer
    ui/             # shadcn/ui primitives (Button, Card, Dialog, etc.)
  contexts/
    AuthContext.tsx      # Session and profile state
    SidekickContext.tsx  # Chat message history
    TourContext.tsx      # Onboarding tour state
  integrations/
    supabase/       # Auto-generated Supabase client and types (do not edit)
  hooks/            # Custom React hooks
  lib/              # Utility functions

supabase/
  functions/        # Deno edge functions
    chat-remix/     # Sidekick AI backend (system prompt, tools, RAG)
    llm-proxy/      # LLM request proxy
    generate-prototype/  # Prototype generation
    ...             # Auth, email, notification functions
  migrations/       # Database migrations
  config.toml       # Supabase project config
```

## Design system

The Studio uses a "warm craft" aesthetic — serif headlines (Fraunces), humanist body (Inter), cream canvas, terracotta accents. See [DESIGN.md](DESIGN.md) for the full design contributor guide, including token rules, typography, and asset conventions.

Key rules:
- All colors are HSL tokens in `src/index.css`, mapped through `tailwind.config.ts`
- Never use raw color classes (`text-white`, `bg-black`) — use semantic tokens (`bg-background`, `text-foreground`)
- Fraunces for headings, Inter for body — no substitutions

## Deployment

The project supports two deployment lanes:

1. **Lovable** (primary) — Prompt changes at the [Lovable project](https://lovable.dev/projects/f5b53aa4-443c-4aa1-8a94-b5a696f8b512). Changes auto-commit to GitHub. Frontend changes go live when you click Publish. Edge function changes deploy automatically.
2. **Local IDE** — Work on a branch, push to GitHub, publish from Lovable.

### URLs

- **Preview:** https://id-preview--f5b53aa4-443c-4aa1-8a94-b5a696f8b512.lovable.app
- **Published:** https://rtstudio.lovable.app
- **Custom domain:** https://studio.relationaltechproject.org

## Philosophy

The Studio is grounded in relational technology principles:

- **The chat is a launching pad, not a destination.** Sidekick helps you take action in your neighborhood, not stay in the app.
- **Build agency, not dependency.** Users should leave feeling capable, not reliant on the tool.
- **Gift to the commons.** Contributions follow a consent-based flow — listen, format, present, wait for approval.
- **Real content only.** Library items use real photos, real voices — no AI-generated stock imagery.

## Contributing

We welcome contributions! See [HACKATHON.md](HACKATHON.md) for a deep technical walkthrough of the codebase, and [DESIGN.md](DESIGN.md) for design guidelines.

## License

[MIT](LICENSE) - Copyright (c) 2025 The Relational Technology Project

## Contact

Josh Nesbit — co-founder, Relational Tech Project
josh@relationaltechproject.org
