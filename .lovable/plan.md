

# Deploy LLM Proxy Edge Function

## What This Does
Creates and deploys a new backend function (`llm-proxy`) that proxies LLM API requests, eliminating CORS issues and keeping API keys server-side. It supports three providers: Anthropic, OpenAI, and an RTP community model.

## Steps

### 1. Create the edge function file
**File:** `supabase/functions/llm-proxy/index.ts`

Copy the uploaded code as-is. The function handles:
- CORS preflight
- Anthropic format translation (OpenAI ↔ Anthropic, including streaming)
- OpenAI/OpenRouter pass-through
- RTP community model (no key needed, uses `RTP_MODEL_URL` env var)

### 2. Deploy the edge function
Deploy `llm-proxy` to Lovable Cloud. It already uses `Deno.serve()` and handles its own CORS — no config.toml changes needed.

### 3. Environment variable
The `VITE_SUPABASE_URL` is already set in `.env`. The client can construct the proxy URL as:
```
${VITE_SUPABASE_URL}/functions/v1/llm-proxy
```
No additional env var is strictly needed, but if you'd like a dedicated `VITE_LLM_PROXY_URL` for clarity, I can add it.

## Notes
- The `RTP_MODEL_URL` secret would need to be set if you want the RTP provider tier to work. Currently not in your secrets list.
- `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are already configured as secrets, but this proxy uses BYOK (client sends keys in the Authorization header), so they aren't used by the function itself.

| File | Change |
|------|--------|
| `supabase/functions/llm-proxy/index.ts` | Create new file with uploaded code |

