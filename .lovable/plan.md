
# Plan: Create HACKATHON.md

## Overview
Create a comprehensive hackathon brief document (`HACKATHON.md`) in the repository root that provides teams with everything they need to evaluate and enhance agency-building in the Relational Tech Studio's Sidekick experience.

## File to Create

**`HACKATHON.md`** - A detailed markdown file containing:

### Document Structure

1. **Challenge Overview** - Frames the hackathon around human agency
2. **What is Agency?** - Defines agency in the neighborhood context
3. **Quick Start** - How to access and explore the app
4. **Technical Architecture** - Stack overview with specific file references
5. **Key Files Reference** - Annotated list of files with line numbers
6. **Database Schema** - All tables with their purposes
7. **Current Agency Features** - What already exists
8. **Configuration Levers** - Where to make changes
9. **Exploration Areas** - Suggested investigation paths
10. **Evaluation Framework** - Humane tech principles to apply
11. **Suggested Experiments** - Hands-on testing ideas
12. **Deliverables** - What teams should produce
13. **Technical Notes** - How to modify key components
14. **Resources** - External links

### Key Technical Details to Include

| Component | File | Key Lines | Purpose |
|-----------|------|-----------|---------|
| AI System Prompt | `supabase/functions/chat-remix/index.ts` | 361-465 | Sidekick's personality, capabilities, and guidance |
| Tool Definitions | `supabase/functions/chat-remix/index.ts` | 11-86 | Structured actions (submit_story, record_commitment, etc.) |
| Profile Personalization | `supabase/functions/chat-remix/index.ts` | 181-220 | How user context influences responses |
| Library RAG | `supabase/functions/chat-remix/index.ts` | 222-359 | Content search and retrieval |
| Rate Limiting | `supabase/functions/chat-remix/index.ts` | 126-179 | 500 messages/day limit |
| Tool Execution | `supabase/functions/chat-remix/index.ts` | 507-622 | How contributions are saved |
| Chat UI | `src/components/Sidekick.tsx` | Full file (362 lines) | Chat interface and state |
| Quick Actions | `src/components/Sidekick.tsx` | 217-251 | Suggested starting prompts |
| Onboarding | `src/components/ProfileOnboarding.tsx` | Full file (372 lines) | Profile context gathering |
| Commitments | `src/components/CommitmentsList.tsx` | Full file (263 lines) | Tracking real-world actions |
| Auth Context | `src/contexts/AuthContext.tsx` | 1-197 | User and profile state |
| Sidekick Context | `src/contexts/SidekickContext.tsx` | Full file | Message history management |

### Database Tables to Document

| Table | Purpose |
|-------|---------|
| `profiles` | User info (name, neighborhood, dreams, tech level) |
| `commitments` | User commitments with status tracking |
| `stories` | Community stories (title, text, attribution) |
| `prompts` | Prompt templates (title, category, example_prompt) |
| `tools` | Tool recommendations (name, description, url) |
| `serviceberries` | Gamification rewards |
| `chat_usage` | Rate limiting (500/day per user) |
| `vision_board_pins` | User dream images |

### Agency Questions to Include
- Does the system prompt encourage offline action?
- Are responses conversation-enders or conversation-extenders?
- How often does Sidekick suggest specific next steps with real people?
- Does commitment tracking lead to follow-through?
- Is there a clear "done" state?

## Benefits
- Teams have all technical context in one place
- Clear line references for efficient exploration
- Framing around humane tech principles
- Actionable areas for improvement
- Defined deliverables

## File Size
Approximately 400-500 lines of well-organized markdown
