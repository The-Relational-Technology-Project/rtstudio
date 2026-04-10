

# Update "What's Inside the Studio" Section

**File:** `src/pages/Landing.tsx`

Replace the 3-column grid with a 2×2 grid (`md:grid-cols-2`) showing four feature cards:

### 1. Sidekick (updated)
- Mockup: chat bubble + "Build a prototype" action button
- Description: "Chat with an AI partner that knows your neighborhood context, surfaces relevant tools and stories, and helps you move from idea to action."

### 2. Prototype Builder (new)
- Icon: `Hammer`
- Mockup: mini browser frame with wireframe preview and "View and share" button
- Description: "Describe what you want to build and get a clickable prototype in minutes. Share it with neighbors for feedback."

### 3. Library (updated copy)
- Keep 2×2 grid mockup
- Description: "A growing commons of stories, tools, prompts, and patterns shared by builders across neighborhoods."

### 4. Events & Network (replaces "Peer Network")
- Icons: `Calendar` + `Users`
- Mockup: mini calendar/event items + builder locations
- Description: "Join live events, see what other builders are working on, and follow network updates in real time."

### Layout
- Change grid from `md:grid-cols-3` to `md:grid-cols-2`
- Add `Hammer, Calendar` to lucide-react imports

| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | Replace "What's Inside" section with 4-card 2×2 grid, updated copy, no "powered by Claude" mention |

