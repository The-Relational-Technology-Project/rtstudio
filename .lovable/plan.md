## Goal
Restore reliable magic-link login for existing and new users on `studio.relationaltechproject.org`, and remove the current 429 failure pattern.

## What I found
- The current 429 happens at the auth `/otp` step, before the custom email queue processes anything.
- The queue infrastructure now exists and appears healthy:
  - `process-email-queue` cron job exists and is active
  - `email_send_state` is present and configured
  - both queues are currently empty
- Your main accounts are confirmed users, so this should be a standard login flow, not a first-time confirmation flow.
- The current system has both an older `email-hook` implementation and the newer `auth-email-hook` implementation in the codebase, which makes the auth-email path more ambiguous than it should be.

## Plan
1. **Audit the live auth email configuration end to end**
   - Verify which auth email hook is actually active for the live backend.
   - Confirm whether auth is still wired to an old hook, the new branded hook, or a mixed state.
   - Check the relevant auth provider settings that govern email send limits and login email behavior.

2. **Stabilize by choosing one auth email path**
   - Remove the split-brain setup so auth uses exactly one delivery path.
   - If the new branded path is correctly provisioned, keep it and finish the migration cleanly.
   - If the new branded path is what introduced the regression, temporarily revert auth emails to the previously working default path so login works again first.

3. **Fix the real source of the 429**
   - Determine whether the auth service is hitting a project-level email throttle, a hook misconfiguration, or a login flow that is accidentally triggering extra auth sends.
   - Adjust configuration so one login attempt results in one legitimate email send, with no accidental retries or misrouted auth actions.

4. **Harden the frontend login experience**
   - Keep the current magic-link request code single-shot and verify no duplicate client requests are happening.
   - Improve the user-facing error handling so throttling or backend auth-send failures produce a precise message instead of a generic failure.

5. **Validate with live-path testing**
   - Test the live login path with a confirmed existing account.
   - Confirm the auth request succeeds, the email hook path is the intended one, and the email is actually delivered.
   - Verify there are matching backend logs so future auth-email issues are easier to diagnose.

## Technical notes
- I will focus first on the auth/backend configuration, not the browser, because the 429 is happening upstream of the queue worker.
- I’ll also clean up the old-vs-new hook ambiguity so there’s one clear source of truth for auth emails.
- If needed for fastest recovery, I’ll prioritize restoring the older working behavior first, then reintroduce branded auth emails safely.

## Expected outcome
- Existing users can request a magic link without hitting the current unexplained rate error.
- New users can still sign up by email.
- There is one clear, reliable auth email path in production instead of a partial migration state.