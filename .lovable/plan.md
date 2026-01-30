

# Plan: Demo Chat Experience on Landing Page

## Overview
Add a minimalist demo chat to the landing page that gives visitors a taste of Sidekick's capabilities before signing up. The demo has sensible restrictions to prevent abuse and encourage account creation.

## Architecture

### Component Structure
```text
Landing.tsx
  ├── Hero (title + subtitle) - KEEP
  ├── DemoChat (new component)
  │     ├── Local state (not SidekickContext)
  │     ├── 10 message limit tracking
  │     ├── Simplified UI (no library item links)
  │     └── Upgrade prompt when limit reached
  ├── Feature Cards - MOVE below chat
  ├── "Enter Your Studio" CTA - UPDATE text
  └── Footer - KEEP
```

## Files to Create/Modify

### 1. New Component: `src/components/DemoChat.tsx`
A standalone demo chat component that:
- Uses local state (NOT the shared SidekickContext)
- Tracks message count in session (localStorage or state)
- Passes `demoMode: true` flag to edge function
- Does NOT display library item preview cards
- Shows upgrade prompt after 10 messages

**Key features:**
- Minimalist welcome: "Try chatting with Sidekick — your AI partner for building tech that brings neighbors together."
- Simple input placeholder: "What would you like to explore?"
- No "Contribute" quick action (can't contribute without login)
- After 10 messages: Overlay with account creation CTA

### 2. Modify: `supabase/functions/chat-remix/index.ts`
Add demo mode handling:

**Changes at request parsing (around line 95):**
- Accept new `demoMode` boolean parameter
- When `demoMode: true`:
  - Use GUEST/DEMO system prompt variation
  - **Do NOT include contribution tools** (prevents submit_story, submit_prompt, submit_tool, record_commitment)
  - Apply separate demo rate limit (10 messages per session tracked client-side, plus IP-based backup limit)

**Demo-specific system prompt additions:**
- "DEMO MODE - This is a preview session. The user is exploring what Sidekick can do."
- "Do NOT offer to save commitments or add contributions - they need to sign up first."
- "Keep responses helpful and inviting. After a few exchanges, naturally mention that signing up unlocks the full experience."

**Security considerations:**
- No tools array passed to AI when in demo mode = no database writes possible
- Library content is still searchable (read-only)
- No user ID to associate with anything

### 3. Modify: `src/pages/Landing.tsx`
Restructure the page layout:

**New layout order:**
1. Hero section (title + subtitle) - unchanged
2. **NEW: DemoChat component** with intro text
3. Feature cards section - moved below chat
4. "Enter Your Studio" button - updated text
5. "What is Relational Tech?" section - unchanged
6. Footer - unchanged

**CTA button change:**
- "Enter the Studio" → "Enter Your Studio"
- Same link to /auth

### 4. Modify: `src/contexts/SidekickContext.tsx`
No changes needed - DemoChat will use local state to keep demo separate from authenticated sessions.

## Demo Chat UX Flow

```text
┌─────────────────────────────────────────────────────┐
│  Relational Tech Studio                              │
│  Your space to craft technology...                   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │  💬 Try Sidekick                             │    │
│  │                                              │    │
│  │  "Try chatting with Sidekick — your AI      │    │
│  │   partner for building tech that brings     │    │
│  │   neighbors together."                      │    │
│  │                                              │    │
│  │  [Remix Something] [Discover Stories]       │    │
│  │                     [Explore Tools]         │    │
│  │                                              │    │
│  │  ┌────────────────────────────────┐ [Send]  │    │
│  │  │ What would you like to explore?│         │    │
│  │  └────────────────────────────────┘         │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  [Sidekick]  [Library]  [Peer Network]  ← cards     │
├─────────────────────────────────────────────────────┤
│           [Enter Your Studio →]                     │
└─────────────────────────────────────────────────────┘
```

**After 10 messages:**
```text
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐    │
│  │                                              │    │
│  │      ✨ You've explored 10 messages!        │    │
│  │                                              │    │
│  │   Sign up to unlock the full Studio:        │    │
│  │   • Save and track your commitments         │    │
│  │   • Contribute your stories to the library  │    │
│  │   • Connect with other neighborhood builders│    │
│  │                                              │    │
│  │        [Enter Your Studio →]                │    │
│  │                                              │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Technical Details

### Edge Function Changes (`chat-remix/index.ts`)

**Line ~95 - Parse demoMode:**
```typescript
const { messages, demoMode } = await req.json();
```

**Line ~243-250 - Demo profile context:**
```typescript
if (demoMode) {
  profileContext = `

DEMO MODE - This visitor is trying out Sidekick before signing up.
You can help them explore the library and understand relational tech.
Do NOT offer to save commitments or contributions - they need to create an account first.
Keep responses inviting. After a few exchanges, you can mention that signing up unlocks features like saving commitments and contributing to the library.
`;
}
```

**Line ~504-512 - Skip tools in demo mode:**
```typescript
body: JSON.stringify({
  model: 'google/gemini-3-pro-preview',
  messages: [...],
  ...(demoMode ? {} : { tools: contributionTools, tool_choice: 'auto' })
})
```

### DemoChat Component Props
```typescript
interface DemoChatProps {
  onLimitReached?: () => void;  // Callback when 10 messages hit
}
```

### Message Limit Implementation
- Store `demoMessageCount` in React state
- Increment on each user message sent
- When count reaches 10, show overlay
- "Start Fresh" button clears messages and resets count

## Security Checklist

| Risk | Mitigation |
|------|------------|
| Library contributions | Tools not passed to AI in demo mode |
| Commitment tracking | record_commitment tool not available |
| Prompt injection | System prompt explicitly marks demo mode |
| Rate limiting abuse | 10 message client limit + no user tracking overhead |
| Data persistence | Nothing saved - demo chat is ephemeral |

## Implementation Sequence

1. **Create DemoChat component** - Local state, simplified UI, message limit
2. **Update chat-remix edge function** - Add demoMode parameter handling
3. **Update Landing.tsx** - Integrate DemoChat, rearrange layout, update CTA text
4. **Deploy and test** - Verify tools are disabled, limit works, conversion flow is smooth

