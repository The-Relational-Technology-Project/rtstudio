
## Problem

The `auth-email-hook` edge function is being called correctly by Supabase Auth (logs confirm "Received auth event" for both signup and magiclink), but every send fails with:

> Could not find the function public.enqueue_email(payload, queue_name)

The hook enqueues emails into a pgmq queue (`auth_emails`) that a cron-driven dispatcher (`process-email-queue`) then drains via Resend. None of that backend plumbing exists in this project yet — only the hook and the templates were deployed earlier. As a result, no magic link or signup email has actually been sent in production, even though the UI shows "Check your email!".

This is also a hard blocker for tomorrow's 1,000+ signup spike.

## Fix

1. **Provision email queue infrastructure** for this project. This creates:
   - `pgmq` queues: `auth_emails` (priority) and `transactional_emails`
   - RPC wrappers including `enqueue_email` (the missing function)
   - `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens` tables
   - `process-email-queue` edge function (the dispatcher)
   - `pg_cron` job running every 5 seconds to drain the queues
   - Vault secret for the dispatcher to authenticate

2. **Redeploy `auth-email-hook`** so it picks up the now-existing `enqueue_email` RPC (no code change needed, but a clean redeploy ensures the schema cache is refreshed).

3. **Verify in prod (Live)**: Because the Supabase cron job and vault secret only get provisioned on the dev instance by the infra setup tool, the Live project needs a **re-publish** to provision its own cron job + vault secret. Without re-publishing, magic links will work on the preview URL but still silently fail on `studio.relationaltechproject.org`.

4. **Smoke test** after publish:
   - Trigger a magic link to a real inbox from `studio.relationaltechproject.org`
   - Confirm row in `email_send_log` flips from `pending` → `sent`
   - Confirm the email actually arrives from `notify.studio.relationaltechproject.org`

## Capacity note for tomorrow

Default queue throughput is ~120 emails/min (batch 10, 200ms delay, 5s cron). For a 1,000+ signups/hour spike, default is sufficient (1,000/hour ≈ 17/min), but I'll bump `email_send_state` to `batch_size = 25, send_delay_ms = 100` after setup to give comfortable headroom in case signups cluster in the first few minutes after the newsletter drops.

## What I will not touch

- Existing `send-magic-link` / `verify-magic-link` functions (the app uses Supabase's native `signInWithOtp`, which routes through `auth-email-hook` — these legacy functions aren't on the live path).
- Email template content (already branded in the previous turn).
- Onboarding consent step (already shipped).
