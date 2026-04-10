

# Sidekick & Prototype UX Overhaul

## Summary
Update quick-action buttons, contribution workflows, prompt card text, prototype preview actions, and library bolded item linking. Move prototype below Sidekick chat. Add post-build chat message. Remove refine feature.

## Changes

### 1. Quick-action buttons in Sidekick
**File:** `src/components/Sidekick.tsx`

Replace the three existing buttons ("Customize a tool", "Read neighbor stories", "Browse tools") + Contribute with:
- **Remix a tool** → `setInput("I'd like to remix a tool for my neighborhood")`
- **Discuss an idea** → `setInput("I have an idea for something I want to build for my neighborhood")`
- **Contribute something** → `setInput("I'd like to contribute something to the commons")`

### 2. Bolded library items as links
**File:** `src/components/Sidekick.tsx`

Update `formatMessageContent` to preserve the full `[LIBRARY_ITEM:type:id:title]` data instead of collapsing to `**title**`. Update `renderBoldText` (rename to `renderFormattedText`) to detect `[LIBRARY_LINK:id:title]` markers and render them as clickable links that navigate to `/library?item={id}`.

### 3. Move prototype below Sidekick, match width
**File:** `src/pages/Home.tsx`

Currently prototype renders **above** Sidekick. Move the `PrototypePreview` component to render **below** the `<Sidekick>` component and above the referenced library items section. To do this cleanly, pass a `prototypeSlot` React node from Home into Sidekick as a prop, which Sidekick renders between chat and library items. This keeps the width matched automatically.

Alternatively (simpler): just reorder the JSX in `Home.tsx` so `PrototypePreview` comes after `Sidekick` in the `space-y-4` container.

### 4. Contribution workflow: Sidekick "Contribute something"
**File:** `supabase/functions/chat-remix/index.ts`

Update the system prompt's contribution instructions. Instead of jumping into drafting/submitting contributions directly:
- After gathering context about what the builder wants to share, ask: "Would you be open to chatting with our steward, Deb, about this? She can help shape your contribution and make sure it lands well in the commons."
- If yes, package a summary and send an email to `deborah@relationaltechproject.org` using the existing `notify-gift-build` pattern (or a new `notify-contribution` function).
- Remove or disable the direct `submit_story`/`submit_tool` tool calls from the contribution flow, replacing with a `notify_contribution_interest` tool that sends the email.

### 5. Library "Contribute" button options
**File:** `src/components/ContributionDialog.tsx`

Replace the three current options with:
- **Share a Story** → Similar to current story form but simplified: name, email, brief description of the story. Sends email to `humans@relationaltechproject.org` with profile info. Include note: "We'll reach out to have a conversation about your story."
- **Share a Tool** → Form for tool name, description, URL. Sends email to `humans@relationaltechproject.org`.
- **Share something else** → Open-ended form with free text. Sends email to `humans@relationaltechproject.org`.

All submissions send emails via a new edge function (or reuse `notify-gift-build` with a different type). Include the user's Studio profile name and email in the email.

### 6. Update prompt intro/outro in system prompt
**File:** `supabase/functions/chat-remix/index.ts`

Change line 596 from:
> After the prompt block, include a brief note like: "You can copy this prompt and paste it into an AI builder tool to start building."

To:
> Before the prompt block, introduce it with: "Here is a prompt you can use to build this."
> After the prompt block, include: "You can build a prototype here in Studio or build a fully-functional tool using an AI builder. A quick tip as you build: replace any AI-generated placeholder text with your own warm, plain-language voice. And of course, once you start adding real data, make sure to use real photos of your neighbors rather than any AI-generated placeholder images. Real faces are what build trust!"

### 7. "Build it" → "Build a prototype"
**File:** `src/components/Sidekick.tsx`

Update the button label in the prompt card from "Build it" to "Build a prototype".

### 8. Build animation: add fun prompt
**File:** `src/components/PromptReviewModal.tsx`

Add a friendly suggestion below the status messages during the build wait:
> "This is a good time to stretch, make tea, or text a neighbor 🙂"

### 9. Remove Refine feature
**Files:** `src/components/PrototypePreview.tsx`, `src/pages/Home.tsx`

- Remove the `onRefine`, `isRefining`, `remaining` props and all refine-related state/UI from `PrototypePreview`.
- Remove `handleRefine`, `isRefining` state from `Home.tsx`.

### 10. Simplify prototype action buttons
**File:** `src/components/PrototypePreview.tsx`

Replace current buttons (Share, Code, Prompt, Embed, Refine) with:
- **View and share** → opens `shareUrl` in a new tab (also marks as shared in DB)
- **Code** → downloads the HTML file (existing `handleDownloadCode`)

Remove Embed and Prompt buttons and their associated UI (embed snippet, refine input).

### 11. Post-build chat message
**File:** `src/pages/Home.tsx`

After successful prototype generation, inject an assistant message into the Sidekick conversation:
> "You'll see your demo prototype below! Share this with neighbors or collaborators to get their feedback. Then bring the prompt into an AI builder to build a fully-functional tool."

This requires `Home.tsx` to access `setMessages` from `SidekickContext`. Import `useSidekick` and call `setMessages` after prototype generation succeeds.

### 12. New edge function for contribution emails
**File:** `supabase/functions/notify-contribution/index.ts` (new)

A lightweight edge function that sends an email to `humans@relationaltechproject.org` (and optionally `deborah@relationaltechproject.org` for story contributions from Sidekick). Accepts: `contributor_name`, `contributor_email`, `contribution_type` (story/tool/other), `description`, `source` (library/sidekick).

Uses the same Resend pattern as `notify-gift-build`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/Sidekick.tsx` | Quick actions, library links, button text |
| `src/pages/Home.tsx` | Move prototype below Sidekick, remove refine, post-build message |
| `src/components/PrototypePreview.tsx` | Simplify to "View and share" + "Code" |
| `src/components/PromptReviewModal.tsx` | Add fun build-wait suggestion |
| `src/components/ContributionDialog.tsx` | New options, email-based submissions |
| `supabase/functions/chat-remix/index.ts` | Update prompt intro/outro, contribution flow |
| `supabase/functions/notify-contribution/index.ts` | New edge function for contribution emails |

