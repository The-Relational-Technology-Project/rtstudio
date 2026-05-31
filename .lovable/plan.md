## Goal

Stop routing returning users to `/profile`. Onboarding still appears once for brand-new signups, but completing it (even with empty fields) lands on `/home`.

## Changes

**1. `src/pages/Landing.tsx`**

Simplify the redirect effect so any signed-in user goes straight to `/home`, regardless of `profile_completed`:

```ts
useEffect(() => {
  if (!user) return;
  navigate("/home", { replace: true });
}, [user, navigate]);
```

Drop the `profile` dependency and the `profile_completed` branch.

**2. `src/components/ProfileOnboarding.tsx`**

`handleComplete` already sets `profile_completed: true` and navigates to `/home` even when fields are blank, so no behavior change is needed — but make the final step explicit that fields are optional (small copy tweak on the last step's primary button, e.g. "Finish" instead of forcing inputs) so users feel free to skip. No required-field validation is added.

**3. `src/pages/AuthCallback.tsx`** (unchanged on purpose)

Keep the existing branch: brand-new signups (no `profile_completed`) still land on `/profile` once so onboarding runs. Returning users with `profile_completed=true` continue to `/home`. Because Landing now always sends signed-in users to `/home`, the only path into onboarding is the first post-signup callback — which matches "onboarding once, then /home forever after".

## Result

- Returning user opens `studio.relationaltechproject.org` → `/home` immediately, no profile check.
- New signup completes magic link → `/profile` (onboarding) → `/home` after clicking Finish, with or without filled fields.
- A user who bailed mid-onboarding previously and signs back in → `/home` (no longer trapped in onboarding via Landing). They can edit their profile manually from `/profile` whenever.

## Out of scope

- No changes to `Profile.tsx`'s gate (`!profile_completed → ProfileOnboarding`). Users who navigate directly to `/profile` while incomplete will still see onboarding there, which is the intended manual entry point.
- No backend/migration changes.
