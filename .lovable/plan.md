# Field Notes

A new authenticated tab in Studio for slow, intentional neighborhood noticing. Warm, journal-like aesthetic — Fraunces display headings, cream/terracotta tones, no SaaS polish.

## Routes & nav

- New route: `/field-notes` (ProtectedRoute) in `src/App.tsx`
- Add `{ name: "Field Notes", path: "/field-notes" }` to `TopNav.tsx` nav items (between Library and Profile)
- New page: `src/pages/FieldNotes.tsx` orchestrates the 3 states based on whether the user has saved notes

## Three states

**State 1 — Welcome (no notes yet)**
- Full-screen centered welcome with the provided copy in Fraunces serif, generous whitespace
- Buttons: "Let's go" (primary) → switches to editor; "I need more info" → expandable section with warm RTP-voice blurb about noticing as care
- Shown only when user has zero saved notes

**State 2 — Editor** (`src/components/field-notes/FieldNoteEditor.tsx`)
- Muted prompt at top: "What do you notice right now — in yourself, in your neighbors, and in your place?"
- Optional title input
- Freeform canvas (single `<div>` with absolutely-positioned blocks + an overlay `<canvas>` for drawing)
- Block types: text block, image upload, divider
- Click empty canvas in text mode → place text block at cursor; blocks are draggable
- Draw mode: freehand strokes saved as SVG paths
- Floating toolbar: Undo / Redo / Text mode / Draw mode / Eraser / **Save** (prominent terracotta), with caption "There is no autosave."
- Undo/redo via a local history stack of canvas snapshots

**State 3 — Gallery** (`src/components/field-notes/FieldNotesGallery.tsx`)
- Grid of cards rendered from `canvas_data` using a lightweight thumbnail renderer (same component, scaled down, non-interactive)
- Title (or "Untitled"), `date_created`, `date_edited` (smaller, only if exists)
- "+ New Field Note" CTA opens blank editor
- Clicking a card opens editor in edit mode

## Save flow

After pressing Save:
1. Insert/update `field_notes` row (set `date_edited` only when canvas_data actually changed)
2. Show `FieldNoteSaveModal`:
   - "Share publicly with others on RTS?" Yes/No
   - "Reminder to write another?" In a week / Let me choose / No thanks
3. If reminder: ask channel (Email / Text / Here on Studio) and collect contact info if needed
4. If shared publicly: call edge function `notify-field-note` → emails deborah@relationaltechproject.org with user name+email and a PDF export of the canvas (html2canvas + jsPDF, same pattern as VisionBoard export)

## Reminders

- Stored on the note as `reminder_at` + `reminder_channel`
- "Here on Studio" channel: when `now >= reminder_at` and not dismissed, TopNav shows a small dot on Field Notes; opening the page shows a dismissible banner and clears the highlight

## Data model

New migration creating `public.field_notes`:

| column | type |
|---|---|
| id | uuid pk |
| user_id | uuid (auth.uid) |
| title | text nullable |
| canvas_data | jsonb (blocks + strokes) |
| is_public | boolean default false |
| reminder_at | timestamptz nullable |
| reminder_channel | text nullable (`email` / `sms` / `studio`) |
| reminder_contact | text nullable |
| reminder_dismissed | boolean default false |
| date_created | timestamptz default now() |
| date_edited | timestamptz nullable |

GRANTs to authenticated + service_role, RLS so users can only CRUD their own rows.

## Edge function

`supabase/functions/notify-field-note/index.ts` — accepts `{ noteId, pdfBase64 }`, validates the caller owns the note, sends Resend email to deborah@relationaltechproject.org with PDF attachment. Reuses the existing `RESEND_API_KEY`.

## Styling

- Cream/parchment background (`bg-background` with a subtle paper texture via CSS gradient)
- Fraunces for the welcome copy and note titles
- Terracotta primary for Save button
- No new tokens needed — uses existing palette

## What's intentionally out of scope

- No autosave, no real-time collab, no rich text formatting beyond plain blocks
- SMS reminders: store the phone number but actual SMS dispatch is out of scope for this PR (note in UI: "we'll text you" — backend cron + Twilio can be added later)
- Email reminders also stored; cron-based dispatch can be added in a follow-up

## Build order

1. Migration for `field_notes` table
2. `notify-field-note` edge function
3. `FieldNoteEditor` (canvas + toolbar + history)
4. `FieldNotesGallery` (thumbnail rendering)
5. `FieldNoteSaveModal` (share + reminder flow)
6. `FieldNotes.tsx` page wiring the three states
7. Route + TopNav entry
8. Reminder banner/highlight logic
