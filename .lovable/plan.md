

# Plan: Gift Build Request Flow (Sidekick + Support Page)

Two entry points for requesting a Gift Build: conversationally through Sidekick (offered at the right moment), and directly via a form on the Support page.

## 1. Database: New `gift_build_requests` table

```sql
CREATE TABLE gift_build_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  builder_name text NOT NULL,
  builder_email text,
  neighborhood text,
  idea_title text NOT NULL,
  idea_summary text NOT NULL,
  conversation_context text,
  source text NOT NULL DEFAULT 'support_page', -- 'sidekick' or 'support_page'
  user_id uuid
);
```

RLS: anon+authenticated can INSERT (so the Support page form works for anyone). No SELECT/UPDATE/DELETE for public.

## 2. New edge function: `notify-gift-build`

Mirrors `notify-signup` pattern:
- Accepts `builder_name`, `builder_email`, `neighborhood`, `idea_title`, `idea_summary`, `source`, optional `conversation_context`
- Validates inputs (title required, reasonable lengths)
- Inserts into `gift_build_requests`
- Sends email to `josh@relationaltechproject.org` via Resend with the idea brief, styled like existing notifications
- Subject line: "Gift Build Request: [idea_title]"
- Rate limited: 3 per hour per identifier (email or user_id)
- No auth required (support page form is public)

## 3. Update `chat-remix` edge function

**New tool** added to `contributionTools`:

```js
{
  name: "submit_gift_build_request",
  description: "Submit a builder's idea for a Gift Build session with the RTP team. Only offer this AFTER a prompt has been created or a concrete build idea has been articulated. The builder should have a clear idea of what they want to build before this is offered.",
  parameters: {
    idea_title: string,
    idea_summary: string,
    builder_name: string,
    neighborhood: string
  }
}
```

**Tool handler**: Calls the `notify-gift-build` edge function (or does the insert + email inline), then returns a response including the cal.com link.

**System prompt addition** (appended to YOUR CAPABILITIES):

```
4. GIFT BUILD REQUESTS:
   When a builder has developed a concrete idea -- either through remixing an existing prompt
   or articulating a new build concept -- you can offer to submit a Gift Build request.
   
   TIMING IS KEY: Do NOT offer this early in conversation. Only offer after:
   - A remixed prompt has been created, OR
   - The builder has described a specific, buildable idea for their neighborhood
   
   THE OFFER: "If you'd like hands-on help bringing this to life, I can submit a Gift Build
   request to Josh from the RTP team. He'll walk you through an initial build and help you
   get set up with the right tools. Want me to send this over?"
   
   After submission, share the scheduling link: https://cal.com/joshnesbit/
   Encourage them to book at least a week out so Josh can review their idea first.
   
   If someone asks about Gift Builds before they have an idea ready, suggest they
   develop their concept first -- either by chatting more with you or exploring the library.
```

## 4. Support page: "Request a Gift Build" section

Add a third section to `Support.tsx` between the Builder's Guide and Jam Session sections (or after Jam Session):

- Heading: "Request a Gift Build"
- Description: Explains that Josh will walk through an initial build with them. Recommends chatting with Sidekick first to develop the idea. Suggests booking at least a week out.
- Simple form fields: Name, Email, Neighborhood (optional), Idea description (textarea)
- Submit button sends to `notify-gift-build` edge function
- Success state with cal.com booking link
- Link to Sidekick: "Not sure where to start? Chat with Sidekick to develop your idea first."

## 5. Files changed

| File | Change |
|------|--------|
| `supabase/migrations/...` | Create `gift_build_requests` table + RLS |
| `supabase/functions/notify-gift-build/index.ts` | New edge function for insert + email |
| `supabase/config.toml` | Add `[functions.notify-gift-build]` with `verify_jwt = false` |
| `supabase/functions/chat-remix/index.ts` | Add `submit_gift_build_request` tool + system prompt update |
| `src/pages/Support.tsx` | Add Gift Build request form section |

