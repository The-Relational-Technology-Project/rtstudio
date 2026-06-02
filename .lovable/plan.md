## Landing page overhaul + Contact page

### Scope
Add-and-adjust pass on `src/pages/Landing.tsx`. Match existing tokens (warm cream bg, Fraunces serif, terracotta primary, off-white rounded cards). No new fonts/colors/shadows.

### 1. Landing.tsx edits
- **Hero tagline**: change "Tap into a commons of relational tech. Remix a tool for your people and place." → "Create or remix a tool for your people and place."
- **Remove** the standalone "What is Relational Tech?" band (its copy moves to FAQ #1).
- **Add three new sections** after "What's Inside the Studio", in order:

  **a. Social signals band** — centered, slim
  - H2: "You're not building alone."
  - Line 1: "Join 300+ builders in diverse neighborhoods across the country."
  - Line 2: "Tap into a commons with hundreds of tools, practices, and stories about relational tech."
  - CTA button "Enter Your Studio" → `/auth`

  **b. At-ease band** — centered, single paragraph, plain (no icons)
  - "This Studio is free to use and stewarded by the Relational Tech Project, a nonprofit project. The Studio and the tool examples are open-source. We have a roadmap toward community ownership of the tools and the infrastructure we use to build them. More in the FAQs below."

  **c. FAQs** — accordion (use existing `@/components/ui/accordion`), all collapsed by default. 6 Q+As exactly as in the prompt (verbatim). Closing line: "Have another question or idea? Please reach out." → link to `/contact`.

### 2. New `/contact` page
- New file `src/pages/Contact.tsx`. Register route in `src/App.tsx` (public, above catch-all).
- Centered cream card. H1 (Fraunces): "Have a question or an idea?" Intro: "Tell us what's on your mind. A real person reads these."
- Fields: name (required), email (required, validated via zod), place (optional), message (required), hidden honeypot `website` field. Submit button "Send" (terracotta).
- On submit: insert row into `contact_messages` then call edge function `notify-contact` to send email. On success replace form with: "Thanks. We'll be in touch." On error: calm retry, preserve input.
- Add `/contact` link to `Footer.tsx` next to "Privacy & Terms".

### 3. Database — new table `contact_messages`
Via migration:
```sql
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  place text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
-- no SELECT policy: only service_role / admins read it
```

### 4. New edge function `notify-contact`
- `supabase/functions/notify-contact/index.ts`, public (no JWT).
- Validates body with zod (name, email, message required; honeypot must be empty → silently 200).
- Sends email via Resend (existing `RESEND_API_KEY` secret):
  - From: `Relational Tech Studio <notifications@relationaltechproject.org>`
  - To: `humans@relationaltechproject.org`
  - Reply-To: submitter's email
  - Subject: `New contact form message from {name}`
  - Plain HTML body with name / email / place / message / timestamp, styled lightly to match brand.
- Returns `{ success: true }`. CORS headers included.

### 5. `index.html` meta
- Update `<title>`, og/twitter title/description to: "Build what you need, with the people around you. A free, open-source studio for making small tools that help your neighborhood gather, share, and care for one another."

### Out of scope
- No changes to Sidekick, library, auth, or other pages.
- No animated counters in social signals band.
- Community-ownership roadmap link deferred (Josh will publish separately).
