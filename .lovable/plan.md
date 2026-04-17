

## Goal
Replace the multi-path Library "Contribute" modal with a single clean "Contribute to the Commons" form that supports text + links + images, followed by a celebratory thank-you screen (serviceberry + schedule-a-call CTA). Email everything to humans@relationaltechproject.org with signed download URLs for images.

## Answers locked in
- **Logged-in builders only** (matches Library pattern; enables reliable serviceberry award).
- **Private storage bucket** with 7-day signed URLs in the email.

## Plan

### 1. Database + Storage migration
- Create private bucket `contribution-uploads`.
- RLS on `storage.objects` for this bucket:
  - Authenticated users can INSERT into their own folder (`auth.uid()::text = (storage.foldername(name))[1]`).
  - No public SELECT. Signed URLs only (generated server-side in the edge function).
- Extend the existing `award_serviceberries` function's allowed-reasons list to include `'contribution_shared'` so the client can award one berry on submit. (Simpler than a new function — same pattern, same safety checks.)

### 2. Rewrite `src/components/ContributionDialog.tsx`
Replace the 3-path picker + 3 forms with **one** compact form:

- **Title** (required, short input) — placeholder: "A short title for your contribution"
- **Your contribution** (required, ~5-row textarea) — placeholder: "Share a story, a tool, an idea, feedback, resources — anything for the commons."
- **Links** (optional, 0–3 URL inputs, "+ Add link" button)
- **Images** (optional, up to 4 files, ≤10MB each, thumbnail previews with X to remove). Uploads go straight to `contribution-uploads/{user_id}/{uuid}-{filename}` via `supabase.storage`.
- **Your name** + **Your email** (prefilled from profile, editable)
- Single submit: "Share with the Commons"

**After successful submit** — swap dialog content (don't close) to a celebration view:
- Heading: "Thank you for your gift"
- Single animated serviceberry (reuse `ServiceberriesCounter` berry styling, one berry, gentle pulse-in)
- Subtext: "You've added a serviceberry to the commons."
- Primary button: "Schedule a chat with Josh" → opens `https://cal.com/joshnesbit` in new tab
- Secondary button: "Done" → closes dialog + resets form

Form controls the `open` state via parent props (already the case). Text sizing tightened so everything fits in the modal without overflow on the current viewport.

### 3. Rewrite `supabase/functions/notify-contribution/index.ts`
- New payload: `{ title, description, links[], imagePaths[], contributor_name, contributor_email }`.
- Validate JWT; reject unauthenticated calls.
- For each `imagePath` in `contribution-uploads`, use the service-role client to generate a 7-day signed URL.
- Send email to humans@relationaltechproject.org with:
  - Title, description, submitter name + email + user ID
  - Links as clickable `<a>` tags
  - Each image rendered inline as `<img>` preview AND as a "Download original" link (signed URL) for easy saving
- Keep Resend setup + CORS as-is.

### 4. Client-side serviceberry award
After the email send succeeds, the client calls:
```
supabase.rpc('award_serviceberries', {
  p_user_id: user.id,
  p_amount: 1,
  p_reason: 'contribution_shared'
})
```
Then transition the dialog to the celebration screen.

## Files to change

| File | Change |
|------|--------|
| `supabase/migrations/<new>.sql` | Create private `contribution-uploads` bucket + per-user INSERT RLS; extend `award_serviceberries` allowed reasons to include `contribution_shared` |
| `src/components/ContributionDialog.tsx` | Single unified form (title, description, links, images, name, email) + celebration screen with serviceberry + Cal.com CTA |
| `supabase/functions/notify-contribution/index.ts` | Accept new payload, require auth, generate 7-day signed URLs for uploaded images, email with inline previews + download links |

## Out of scope
- No steward review dashboard (you'll hand-curate).
- No auto-publish to library.
- No changes to the Sidekick/chat contribution path.
- No DB table for contributions — content lives only in the email (per your curation workflow).

