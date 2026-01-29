# Hackathon Brief: Agency-Building in the Relational Tech Studio

## Challenge Overview

The Relational Tech Studio is an AI-powered platform helping neighbors create technology for community care. At its heart is **Sidekick**, an AI chat assistant designed to be a "springboard into the neighborhood" — not a destination in itself.

**Your challenge:** Evaluate and enhance Sidekick's ability to build human agency — the feeling that users can affect change in their lives and neighborhoods, and the motivation to go interact with real people to make that change happen.

The chat should be a **launching pad**, not a destination.

---

## What is Agency in This Context?

Agency means users:

1. **Feel empowered** to take action in their neighborhoods
2. **Have clear next steps** that involve real-world interactions
3. **Build capabilities** to create change without depending on the tool
4. **Connect with others** rather than staying in the chat
5. **Own their creations** and can remix, share, and modify freely

### Key Questions

- Does the system encourage users to **leave the app** and take action?
- Are AI responses designed to be **conversation-enders** (leading to action) or **conversation-extenders**?
- Does commitment tracking lead to **actual follow-through**?
- Is there a clear **"done" state** where users feel ready to go?

---

## Quick Start

### Live Application
- **Preview URL:** https://id-preview--f5b53aa4-443c-4aa1-8a94-b5a696f8b512.lovable.app
- **Published URL:** https://rtstudio.lovable.app

### Key Entry Points
1. Sign up and complete profile onboarding
2. Try the Sidekick chat at `/sidekick`
3. Explore the Library at `/library`
4. Check your Profile at `/profile` for commitments and vision board

### Suggested First Experiments
1. Have a conversation about organizing something in your neighborhood
2. Try contributing a story or prompt
3. Make a commitment and see how it's tracked
4. Try to "leave" the chat with clear next steps — does Sidekick help you do that?

---

## Technical Architecture

### Frontend Stack
| Technology | Purpose |
|------------|---------|
| React 18 | Component framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| React Router | Navigation |
| TanStack Query | Data fetching |

### Backend (Lovable Cloud / Supabase)
| Service | Purpose |
|---------|---------|
| PostgreSQL | Database |
| Edge Functions (Deno) | Server-side logic |
| Row-Level Security | Data protection |
| File Storage | Vision board images |

### AI Integration
| Component | Details |
|-----------|---------|
| Gateway | Lovable AI Gateway |
| Model | `google/gemini-3-pro-preview` |
| Features | Tool-calling for structured actions |

---

## Key Files Reference

### 🧠 AI Backend Logic

**File:** `supabase/functions/chat-remix/index.ts` (641 lines)

| Section | Lines | Purpose |
|---------|-------|---------|
| Tool Definitions | 11-86 | Structured actions: `submit_story`, `submit_prompt`, `submit_tool`, `record_commitment` |
| Rate Limiting | 126-179 | 500 messages/day per user |
| Profile Personalization | 181-220 | Fetches user context (name, neighborhood, dreams, tech level) |
| Library RAG Search | 222-359 | Keyword extraction and content matching |
| **System Prompt** | **361-465** | **Sidekick's personality, capabilities, and guidance** |
| AI API Call | 467-503 | Request to Lovable AI Gateway |
| Tool Execution | 507-622 | Database inserts for contributions and commitments |

#### System Prompt Highlights (Lines 361-465)

The system prompt defines Sidekick's identity and behavior:

```
Lines 361-368: Core identity as "Sidekick" and relational tech philosophy
Lines 370-378: "Habits of the Relational Tech Heart" principles
Lines 380-391: Capability 1 - Explore the Library
Lines 386-391: Capability 2 - Remix Prompts
Lines 393-425: Capability 3 - Receive Contributions (Commons Librarian flow)
Lines 427-434: Style guidelines
Lines 460-463: Commitment tracking behavior
```

#### Tool Definitions (Lines 11-86)

Four structured tools the AI can invoke:

1. **submit_story** (lines 14-28): Add a neighborhood story to the library
2. **submit_prompt** (lines 32-46): Add a prompt template
3. **submit_tool** (lines 50-63): Add a tool recommendation
4. **record_commitment** (lines 67-85): Track a user commitment

---

### 💬 Chat UI

**File:** `src/components/Sidekick.tsx` (362 lines)

| Section | Lines | Purpose |
|---------|-------|---------|
| Imports & Types | 1-37 | Message types, contribution data structures |
| Component State | 39-51 | Messages, loading, library items, contributions |
| API Integration | 63-97 | `sendMessage()` function calling edge function |
| Quick Actions | 217-251 | Four suggested starting prompts |
| Message Rendering | 254-310 | Chat bubble display with copy functionality |
| Contribution Banner | 332-348 | Shows when user adds to library |
| Library Item Cards | 350-359 | Preview cards for referenced items |

#### Quick Actions (Lines 217-251)

These are the suggested starting prompts shown to new users:

```tsx
- "Help me find a prompt to remix"
- "Show me some community stories"
- "What tools can help me organize a block party?"
- "I want to share something that worked in my neighborhood"
```

---

### 👤 Profile & Onboarding

**File:** `src/components/ProfileOnboarding.tsx`

Captures user context that personalizes AI responses:
- Name and display name
- Neighborhood and description
- Dreams and goals for their neighborhood
- Tech familiarity level (new → experienced)
- AI coding experience (never → daily)

---

### ✅ Commitment Tracking

**File:** `src/components/CommitmentsList.tsx`

Tracks real-world commitments users make during chat:
- Status: active / completed
- Context from the conversation that sparked it
- Serviceberry rewards for completion
- Edit and delete capabilities

---

### 🔐 Auth & State Management

**File:** `src/contexts/AuthContext.tsx` (197 lines)

Manages user authentication and profile state:
- Session management
- Profile fetching
- Sign out functionality

**File:** `src/contexts/SidekickContext.tsx` (34 lines)

Simple message history management for the chat:
- `messages` array state
- `setMessages` and `clearMessages` functions

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User info | `display_name`, `neighborhood`, `dreams`, `tech_familiarity`, `ai_coding_experience` |
| `commitments` | User commitments | `commitment_text`, `status`, `source_chat_context`, `completed_at` |
| `stories` | Community stories | `title`, `story_text`, `full_story_text`, `attribution` |
| `prompts` | Prompt templates | `title`, `category`, `description`, `example_prompt` |
| `tools` | Tool recommendations | `name`, `description`, `url` |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `serviceberries` | Gamification rewards for contributions and completions |
| `chat_usage` | Rate limiting (500 messages/day per user) |
| `vision_board_pins` | Images representing user dreams |
| `story_notes` | Community notes on stories |
| `tool_notes` | Community notes on tools |

---

## Current Agency-Building Features

### 1. Commitment Tracking

When users express intentions ("I'm going to organize a block party"), Sidekick can:
- Recognize the commitment in natural language
- Ask for confirmation: "Would you like me to track this for you?"
- Store it in their profile with conversation context
- Award serviceberries when marked complete

**Code:** `chat-remix/index.ts` lines 460-463 (prompt), 546-594 (execution)

### 2. Contribution Flow (Commons Librarian)

Users can gift to the commons:
- Stories from their neighborhoods
- Prompt templates they've created
- Tool recommendations

The AI follows a consent-based flow (lines 405-425):
1. Listen & appreciate
2. Lightly edit & format
3. Present for consent
4. Wait for explicit approval
5. Celebrate the gift

### 3. Profile Personalization

The AI adapts based on (lines 181-220):
- User's name (natural greeting)
- Neighborhood context
- Stated dreams
- Tech comfort level
- AI coding experience

### 4. Library RAG Search

Sidekick searches for relevant content (lines 222-359):
- Extracts keywords from user messages
- Searches stories, prompts, and tools
- Scores results by relevance
- Includes matches in AI context

---

## Configuration Levers

These are the key places to modify Sidekick's behavior:

| Lever | Location | What It Controls |
|-------|----------|------------------|
| **System Prompt** | `chat-remix/index.ts:361-465` | AI personality, capabilities, guidance |
| **Quick Actions** | `Sidekick.tsx:217-251` | Suggested starting prompts |
| **Tool Definitions** | `chat-remix/index.ts:11-86` | Structured actions AI can take |
| **Profile Fields** | `ProfileOnboarding.tsx` | Context gathered from users |
| **Serviceberry Rewards** | `chat-remix/index.ts:576-581` | Incentive amounts |
| **Rate Limits** | `chat-remix/index.ts:127` | Messages per day (currently 500) |

---

## Exploration Areas

### A. Audit Current Agency Support

Questions to investigate:

1. **System Prompt Analysis** (lines 361-465)
   - Does it encourage users to take action offline?
   - Does it suggest specific next steps with real people?
   - Is there guidance to end conversations with clear actions?

2. **Response Patterns**
   - Are responses conversation-enders or conversation-extenders?
   - How often does Sidekick ask about who the user will talk to?
   - Does it help users identify neighbors who could help?

3. **Commitment Flow** (lines 460-463, 546-594)
   - Is recognition of commitments proactive enough?
   - Does tracking lead to follow-through?
   - Are completion celebrations meaningful?

4. **Exit Points**
   - Is there a clear "done" state?
   - Does the UI encourage leaving when ready?
   - Are there "come back and share" patterns?

### B. Potential Enhancements

#### System Prompt Modifications (lines 361-465)

Consider adding:
- Explicit instruction to end conversations with actionable next steps
- Prompts to ask "Who in your neighborhood could help with this?"
- Guidance to suggest specific offline actions
- "Time to go" recognition when users have what they need

#### UI/UX Changes

- Add "Ready to go?" prompts after substantive exchanges
- Surface commitments as "Next Actions" more prominently
- Create "Success Story" flows for returning users
- Add celebration for users who report taking action

#### New Tools

Consider adding tool definitions for:
- `suggest_neighbor_action`: Structured recommendation for who to talk to
- `schedule_followup`: Help users set a time to return and share
- `celebrate_action`: Acknowledge when users report taking real-world steps

#### Metrics & Monitoring

Track:
- Conversation-to-commitment conversion rate
- Commitment completion rates
- Time from commitment to completion
- Return visits to share outcomes
- Session duration (shorter may be better!)

### C. Experiment Ideas

1. **Prompt Variations**
   - A/B test system prompts with stronger "go offline" language
   - Compare commitment recognition rates across prompt versions

2. **UI Experiments**
   - Add a "Ready to take action?" button
   - Test prominent display of active commitments
   - Try "celebration moments" for completed commitments

3. **Follow-up Patterns**
   - Test reminder prompts for active commitments
   - Experiment with "How did it go?" check-ins
   - Try different serviceberry reward amounts

---

## Evaluation Framework

Apply these humane tech principles:

| Principle | Questions |
|-----------|-----------|
| **Minimizes time in app** | Does the experience efficiently get users to their goals? |
| **Promotes offline action** | Does it lead to real-world interactions? |
| **Builds user capability** | Do users learn and grow, not just depend? |
| **Respects attention** | No dark patterns, no engagement maximization? |
| **Supports reflection** | Does it help users think, not just consume? |
| **Creates real value** | Are the outputs genuinely useful in the neighborhood? |

### Agency Health Indicators

**Positive signals:**
- Short, focused conversations that end with clear next steps
- High commitment completion rates
- Users returning to share outcomes
- Prompts that get remixed and used in the real world

**Warning signs:**
- Long, meandering conversations without actionable outcomes
- Low commitment completion rates
- Users not returning after making commitments
- Dependency on the chat rather than building capability

---

## Deliverables

Your team should produce:

### Required

1. **Agency Audit** (Document)
   - Assessment of current agency-building in Sidekick
   - Specific findings with line references
   - Recommendations prioritized by impact

2. **Enhancement Proposal** (Document or PR)
   - Specific changes to code, configuration, or prompts
   - Rationale connecting changes to agency principles
   - Implementation approach

3. **Monitoring Plan** (Document)
   - Metrics to track agency-building over time
   - Data collection approach
   - Success criteria

### Optional

4. **Working Prototype** (Code)
   - Implementation of your top recommendation
   - Before/after demonstration
   - Notes on what you learned

---

## Technical Notes for Developers

### Modifying the System Prompt

Edit `supabase/functions/chat-remix/index.ts` starting at line 361.

The prompt is a template string that includes:
- Static instructions (lines 361-459)
- `${profileContext}` - User personalization (injected at line 465)
- `${libraryContext}` - Relevant library items (injected at line 465)

After changes, the edge function will redeploy automatically.

### Adding New Tools

1. Add tool definition to `contributionTools` array (after line 86)
2. Handle the tool call in the switch statement (around line 520)
3. Return appropriate response with contribution data

Example tool structure:
```typescript
{
  type: "function",
  function: {
    name: "your_tool_name",
    description: "When to call this tool",
    parameters: {
      type: "object",
      properties: {
        param1: { type: "string", description: "What this is" }
      },
      required: ["param1"],
      additionalProperties: false
    }
  }
}
```

### Modifying Quick Actions

Edit `src/components/Sidekick.tsx` lines 217-251.

Each button sets the input field and can trigger immediate submission:
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => setInput("Your prompt text here")}
  className="text-xs"
>
  Button Label
</Button>
```

### Tracking New Metrics

1. Create database table via migration
2. Log events from edge function or frontend
3. Query with analytics tools

### Testing Changes

- **Edge functions:** Changes deploy automatically; test via the chat
- **Frontend:** Changes reflect immediately in preview
- **Database:** Changes require migrations

---

## Resources

### Humane Technology
- [Center for Humane Technology](https://www.humanetech.com/)
- [Humane Design Guide](https://www.humanetech.com/designguide)

### Relational Technology
- [Relational Tech Project](https://relationaltechproject.org/)
- [The Sidekick Blog](https://sidekick.so/blog)

### Technical
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Discussion Questions

1. What would "successful agency-building" look like in chat logs?
2. How might we detect when a user is ready to act vs. still exploring?
3. What's the right balance between helpful persistence and "letting go"?
4. How could we celebrate users who took action offline?
5. What would a "relational tech health check" look like for Sidekick?
6. How do we measure success when the goal is for users to leave?

---

## Contact

Questions during the hackathon? Reach out to the Studio team or open an issue in the repository.

Happy hacking — and remember: the best outcome is neighbors connecting in the real world! 🏘️
