

# Secure API for External Profile Access

## Approach

Create a private edge function that uses a shared secret to authenticate requests, then queries profiles using the service role (bypassing RLS). Your Claude skill calls this endpoint with the secret.

## How It Works

1. **New edge function: `admin-profiles`** — accepts a bearer token, validates it against a secret (`ADMIN_API_KEY`), then returns all profiles using the Supabase service role client
2. **New secret: `ADMIN_API_KEY`** — a strong random token you generate and store both in Studio secrets and in your Claude skill.md
3. Claude's skill calls: `POST https://{supabase_url}/functions/v1/admin-profiles` with `Authorization: Bearer {ADMIN_API_KEY}`

## Response Shape

Returns all profiles with: `id`, `display_name`, `full_name`, `email`, `neighborhood`, `neighborhood_description`, `dreams`, `tech_familiarity`, `ai_coding_experience`, `local_tech_ecosystem`, `profile_completed`, `created_at`, `updated_at`

Optional query param `?since=2026-03-01T00:00:00Z` to fetch only recently updated profiles (for incremental sync).

## Technical Details

**File:** `supabase/functions/admin-profiles/index.ts`

- Validates `Authorization: Bearer <token>` against `ADMIN_API_KEY` env var
- Uses `SUPABASE_SERVICE_ROLE_KEY` to create a service-role client (bypasses RLS)
- Queries `profiles` table, optionally filtered by `updated_at > since`
- Returns JSON array of profiles
- No JWT verification needed (custom auth via secret)

**Config:** Add `[functions.admin-profiles]` with `verify_jwt = false` to `supabase/config.toml`

**Secret:** I'll prompt you to set an `ADMIN_API_KEY` value — you generate a strong random string and use the same value in your Claude skill

## Security

- The service role key never leaves the edge function
- The `ADMIN_API_KEY` acts as a simple bearer token gate
- No public access without the secret
- Profiles data stays private from the public REST API

