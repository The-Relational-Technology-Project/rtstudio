import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRIMARY_MODEL = 'claude-opus-4-7';
const FALLBACK_MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 8000;
const DAILY_LIMIT = 10;

// System prompt is large and stable, so it's prompt-cached on the Anthropic side.
const SYSTEM_PROMPT = `You are the Relational Tech Studio's build-plan author. The Studio is an open commons where neighbors across many neighborhoods are building small, local tools with each other.

A builder has just had a chat with Sidekick (the Studio's AI guide) about a tool they want to build for their neighborhood. Your job is to turn that conversation into two artifacts — a polished, detailed prompt and a concrete plan — that the builder can copy, paste, and run with this afternoon.

# YOUR INPUTS

You receive:
- The builder's profile (name, neighborhood, dreams, tech and AI-coding comfort, local tech ecosystem). Personalize when fields are populated; never invent details when they're empty.
- A chat transcript between the builder and Sidekick — THIS IS THE BRIEF. Read it carefully. The builder's actual idea, the specific neighborhood texture they shared, the audience, the constraints — all of it lives in here. Do not skim. Sidekick deliberately doesn't write prompts in chat anymore; you write the prompt from the conversation itself.
- Optionally, a draft prompt (only present if a legacy caller sent one). Treat it as a seed, but the chat transcript is still the authoritative brief — if they diverge, trust the chat.
- Library item bodies — patterns Sidekick referenced in the conversation. Draw on these for structure and texture, but do NOT copy verbatim. The builder's tool is theirs, not a fork of a library item.

Always return your answer by calling the deliver_build_plan tool. Never reply with plain prose.

# THE DETAILED PROMPT (detailed_prompt_markdown)

This is what the builder will paste into Lovable, Claude Code, Dyad, or Google AI Studio. Treat it as the spec for the tool. It must be self-contained — a future builder or AI should be able to build something useful from it without re-reading the chat.

Sections to include, in this order:

1. **Purpose** — what this tool is for, in 1–2 sentences, in plain language. Name the neighborhood by name when the builder's profile gives it.
2. **Who it's for** — the neighbors who will actually use it. Be specific (long-time residents, new arrivals, families with kids on a particular block) rather than generic.
3. **Core flows** — the 2–4 primary actions a neighbor will take. Walk through each as steps.
4. **Pages / screens** — name the screens. Mark the 1–2 most central as "Primary" and the rest as "Secondary (can be stubbed in v1)."
5. **Data model in plain English** — the handful of objects the app stores, what fields they have. No SQL, no code — sentences.
6. **What's in v1 vs. what's deferred** — a short two-list cut. v1 should be the smallest thing a builder can hand to one neighbor.
7. **Aesthetic + visual design, anchored in this place** — write the visual direction as if you live in the builder's neighborhood. Reference the actual place by name. Suggest a warm community-bulletin-board / local-cafe / neighborhood-library feel rather than a corporate or startup look. Pick a small palette (warm neutrals plus one or two accent colors) and 1–2 typography moves that fit the place's character. Avoid generic words like "modern, clean, minimal."
8. **Guardrails the downstream builder MUST follow** — copy these into the prompt as a block so any AI tool building this respects them:
   - Do NOT use AI-generated photos, faces, or photo-realistic illustrations.
   - Do NOT use large decorative AI illustrations or generated hero artwork.
   - If a photo is needed and the builder hasn't provided one, leave a clearly labeled placeholder ("Add a real photo here") rather than generating one.
   - Do NOT write flowery marketing copy. Leave human-readable TODO placeholders like \`TODO: write this paragraph in your own voice — describe what this part of the block looks like on a Saturday morning\` so the builder can fill it in themselves. The builder's voice and their neighbors' voices are what make the tool feel real.
   - Mobile-first. Most neighbors will see this on a phone.
   - Use a few accessible color choices rather than many. Keep type sizes large.
9. **Tone of voice for future copy** — a one-paragraph note for the builder about the voice the tool should have, drawing on how they spoke in the chat (warm, dry, organizer-blunt, etc.).
10. **What "good enough to share with one neighbor" looks like** — three concrete bullets describing the smallest first version. The bar is "would Maya from across the street actually click around this for a minute," not "is it complete."

Format the detailed prompt as clean markdown with these sections as ## headers. No code fences around the whole thing. No conversational preamble. Start straight with the # title line.

# THE PLAN (plan_markdown)

This is the builder's how-to-build-it walkthrough. Three sections, in this order:

## 1. How will you build this?

Three options. Order them by what fits this idea best:

- **Fork from an existing codebase** — only mention this option if the chat explicitly identified a real fork-able codebase. If not, OMIT this option entirely. Do not invent forks.
- **Build a fresh tool from the prompt above** — always available, always the default. Say so plainly. The detailed prompt is the spec.
- **Use a hosted platform that already does this** — only mention this option if the chat explicitly identified a real multi-tenant platform that fits (e.g., communitysupplies.org for tool/supply sharing). If not, OMIT this option entirely.

End this section with a one-line note: "We're adding more fork and hosted-platform options to the Studio soon — for now, the fresh build path is the strongest one."

## 2. Pick your builder tech

Use the builder's profile (passed in below) to recommend a specific track. There are exactly two tracks:

**Lovable track** (recommend when ai_coding_experience is "never" or "a_little"):
- **Lovable** in plan mode to start, then build mode. Bring the detailed prompt above in by pasting it as the first message.
- **Lovable hosting** to publish.
- **Lovable Cloud** for backend storage (auth, database).
- **Lovable's email service** for transactional email.
- **Namecheap** for a custom domain.
- Set recommended_track to "lovable".

**Claude Code track** (recommend when ai_coding_experience is "regular" or "daily"):
- **Claude Code** for design and development. Paste the detailed prompt as the initial brief.
- **Vercel** for hosting.
- **Neon or Supabase** for the backend (Postgres + auth).
- **Resend** for transactional email.
- **Namecheap** for a custom domain.
- Set recommended_track to "claude_code".

For both tracks, also mention **Dyad** and **Google AI Studio** as alternates the builder could explore if curious.

If the builder's profile mentions a specific local tech ecosystem (local_tech_ecosystem field), surface a one-line note about how that local ecosystem might be useful (a place to share early, find collaborators, etc.).

## 3. Share with one neighbor

Walk the builder through a concrete next-90-minutes path:
- Ship the roughest working version you can — bugs are fine.
- Pick one neighbor who you already know will care about this. Name a real candidate type ("the neighbor who runs the little free library," "the parent who organizes the block bbq").
- Send them the link. Ask three specific questions about what they'd want different. Make it easy for them to be honest.
- Set a coffee/tea date this week to sit down and edit copy together — this is where co-creation actually starts.

Format the plan as clean markdown with the ## headers above. No code fences around the whole thing. Start with a single # title line that says something like "# Your build plan."

# THE TITLE

Generate a short, warm, place-specific title for this build plan — under 60 characters, noun phrase, no quotes. Think "Sunset Stoop Sale Board" not "Untitled Plan." Avoid "App" / "Tool" / "Platform" suffixes when possible. The builder will see this on their profile.

# WRITING DISCIPLINE

- Reference the builder's neighborhood by name when their profile gives it AND when the build is tied to place. If the build is generic (a habit tracker, a recipe app), don't shoehorn the neighborhood in.
- Don't invent details about the neighborhood. If you don't know it, write the prompt and plan with placeholders the builder will fill in.
- No flattery. No "amazing idea!" / "this is going to be wonderful!" energy. Sidekick is a collaborator, not a cheerleader, and so are you.
- No emojis. No exclamation points except in direct quotes.
- The detailed prompt and the plan are read separately and copied to the clipboard separately. Each must stand alone.`;

const DELIVER_BUILD_PLAN_TOOL = {
  name: 'deliver_build_plan',
  description: 'Return the finished build plan as structured fields. Always use this tool to respond.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Short warm noun-phrase title, under 60 characters. Used as the card title on the builder profile.',
      },
      detailed_prompt_markdown: {
        type: 'string',
        description: 'The full detailed prompt as markdown. Builder copies this to paste into Lovable / Claude Code / Dyad.',
      },
      plan_markdown: {
        type: 'string',
        description: 'The plan as markdown with the three required sections.',
      },
      recommended_track: {
        type: 'string',
        enum: ['lovable', 'claude_code'],
        description: 'Which builder-tech track was recommended based on profile.',
      },
    },
    required: ['title', 'detailed_prompt_markdown', 'plan_markdown', 'recommended_track'],
  },
};

interface BuilderProfile {
  full_name: string | null;
  display_name: string | null;
  neighborhood: string | null;
  neighborhood_description: string | null;
  dreams: string | null;
  tech_familiarity: string | null;
  ai_coding_experience: string | null;
  local_tech_ecosystem: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LibraryItem {
  kind: 'prompt' | 'tool' | 'story';
  id: string;
  title: string;
  body: string;
}

function buildUserPrompt(args: {
  draftPrompt: string | null;
  chatExcerpt: string;
  libraryItems: LibraryItem[];
  profile: BuilderProfile | null;
}): string {
  const { draftPrompt, chatExcerpt, libraryItems, profile } = args;

  const profileBlock = profile
    ? `BUILDER PROFILE
- Name: ${profile.display_name || profile.full_name || 'Builder'}
- Neighborhood: ${profile.neighborhood || 'Not specified'}${profile.neighborhood_description ? ` — ${profile.neighborhood_description}` : ''}
- Their dream: ${profile.dreams || 'Not specified'}
- Tech comfort: ${profile.tech_familiarity || 'Not specified'}
- AI coding experience: ${profile.ai_coding_experience || 'Not specified'}
- Local tech ecosystem: ${profile.local_tech_ecosystem || 'Not specified'}`
    : `BUILDER PROFILE
- Profile not available — treat the builder as a generic neighbor and keep the prompt place-agnostic.`;

  // Library item bodies — Sidekick referenced these in the chat, so the builder
  // may have anchored on patterns from them. Opus uses these as reference, not
  // as something to copy verbatim.
  const libraryBlock = libraryItems.length > 0
    ? libraryItems
        .map((item) => `--- ${item.kind.toUpperCase()}: ${item.title} ---\n${item.body}\n`)
        .join('\n')
    : '(no library items referenced)';

  // Draft-prompt block — only included when a legacy caller still supplies one.
  // The new flow uses the chat-as-brief mode and omits this.
  const draftBlock = draftPrompt && draftPrompt.trim().length >= 20
    ? `DRAFT PROMPT FROM THE CHAT (Sidekick wrote this — use as a seed, but feel free to restructure):
${draftPrompt}

`
    : `DRAFT PROMPT FROM THE CHAT: (none — chat-as-brief mode; derive the build from the conversation itself)

`;

  return `${profileBlock}

${draftBlock}CHAT TRANSCRIPT (this IS the brief — read carefully to understand what the builder wants)
${chatExcerpt || '(no chat transcript provided)'}

LIBRARY ITEMS REFERENCED IN THE CHAT (full bodies — patterns to draw on, not to copy verbatim)
${libraryBlock}

Now produce the title, detailed prompt, and plan, and call the deliver_build_plan tool.`;
}

async function callAnthropic(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ output: { title: string; detailed_prompt_markdown: string; plan_markdown: string; recommended_track: string }; inputTokens: number; outputTokens: number; }> {
  const { apiKey, model, systemPrompt, userPrompt } = args;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      // Prompt-cache the long system prompt — high reuse across builders.
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      tools: [DELIVER_BUILD_PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'deliver_build_plan' },
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Anthropic API error: ${response.status} ${errText}`);
    (err as any).status = response.status;
    (err as any).body = errText;
    throw err;
  }

  const data = await response.json();
  const usage = data.usage || {};
  const inputTokens = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  const outputTokens = usage.output_tokens || 0;

  const toolUse = (data.content || []).find((c: any) => c.type === 'tool_use' && c.name === 'deliver_build_plan');
  if (!toolUse || !toolUse.input) {
    throw new Error('Model did not return a deliver_build_plan tool call');
  }

  const out = toolUse.input;
  if (!out.title || !out.detailed_prompt_markdown || !out.plan_markdown || !out.recommended_track) {
    throw new Error('deliver_build_plan tool call missing required fields');
  }

  return { output: out, inputTokens, outputTokens };
}

function isModelUnavailableError(err: any): boolean {
  const status = err?.status;
  const body = (err?.body || '').toLowerCase();
  if (status === 404) return true;
  if (status === 400 && (body.includes('model') || body.includes('not_found'))) return true;
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Authenticate user — same pattern as generate-prototype
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    let builderId: string;
    try {
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        const { data: { user }, error: authError } = await userSupabase.auth.getUser();
        if (authError || !user?.id) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication. Please sign in again.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        builderId = user.id;
      } else {
        builderId = claimsData.claims.sub as string;
      }
    } catch (authErr) {
      console.error('Auth exception:', authErr);
      return new Response(
        JSON.stringify({ error: 'Authentication failed. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request
    const body = await req.json().catch(() => ({}));
    // draft_prompt is OPTIONAL now (chat-as-brief mode). Legacy callers may still send it.
    const draftPromptRaw: string = (body?.draft_prompt ?? '').toString();
    const draftPrompt: string | null = draftPromptRaw.trim().length >= 20 ? draftPromptRaw : null;
    const ideaTitleHint: string = (body?.idea_title ?? '').toString();
    const libraryItemIds: string[] = Array.isArray(body?.library_item_ids)
      ? body.library_item_ids.filter((x: any) => typeof x === 'string').slice(0, 20)
      : [];
    const chatMessages: ChatMessage[] = Array.isArray(body?.chat_messages)
      ? body.chat_messages
          .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-20)
      : [];

    // Need either a draft prompt OR enough chat to derive a brief from.
    const totalChatChars = chatMessages.reduce((n, m) => n + (m.content?.length || 0), 0);
    if (!draftPrompt && totalChatChars < 200) {
      return new Response(
        JSON.stringify({ error: 'Not enough conversation yet. Chat with Sidekick a bit more, then come back to create the plan.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate-limit: 10 plans per builder per UTC day
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('build_plans')
      .select('id', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .gte('created_at', todayStart.toISOString());

    if (countError) {
      console.error('Rate limit check error:', countError);
    }

    const todayCount = count || 0;
    if (todayCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `You've created ${DAILY_LIMIT} build plans today. Come back tomorrow, or take what you have to Claude Code or Lovable to keep going.`,
          remaining: 0,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pull builder profile + library item bodies in parallel.
    const [profileRes, promptsRes, toolsRes, storiesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, display_name, neighborhood, neighborhood_description, dreams, tech_familiarity, ai_coding_experience, local_tech_ecosystem')
        .eq('id', builderId)
        .maybeSingle(),
      libraryItemIds.length > 0
        ? supabase.from('prompts').select('id, title, example_prompt, description').in('id', libraryItemIds)
        : Promise.resolve({ data: [] as any[] }),
      libraryItemIds.length > 0
        ? supabase.from('tools').select('id, name, description, url').in('id', libraryItemIds)
        : Promise.resolve({ data: [] as any[] }),
      libraryItemIds.length > 0
        ? supabase.from('stories').select('id, title, story_text, full_story_text').in('id', libraryItemIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profile = profileRes.data ?? null;

    // Coalesce library items across kinds. Cap each body to keep prompt size sane.
    const BODY_CAP = 4000;
    const libraryItems: LibraryItem[] = [
      ...((promptsRes.data || []) as any[]).map((p: any) => ({
        kind: 'prompt' as const,
        id: p.id,
        title: p.title,
        body: (p.example_prompt || p.description || '').toString().slice(0, BODY_CAP),
      })),
      ...((toolsRes.data || []) as any[]).map((t: any) => ({
        kind: 'tool' as const,
        id: t.id,
        title: t.name,
        body: `${(t.description || '').toString()}\n\nURL: ${t.url || ''}`.slice(0, BODY_CAP),
      })),
      ...((storiesRes.data || []) as any[]).map((s: any) => ({
        kind: 'story' as const,
        id: s.id,
        title: s.title || 'Story',
        body: (s.full_story_text || s.story_text || '').toString().slice(0, BODY_CAP),
      })),
    ].filter((item) => item.body.trim().length > 0);

    // Build the chat excerpt (compact form)
    const chatExcerpt = chatMessages
      .map((m) => `${m.role === 'user' ? 'Builder' : 'Sidekick'}: ${m.content.trim()}`)
      .join('\n\n')
      .slice(0, 12000); // cap to keep prompt sane

    const userPrompt = buildUserPrompt({
      draftPrompt,
      chatExcerpt,
      libraryItems,
      profile: (profile as BuilderProfile | null) ?? null,
    });

    console.log(`Generating build plan for ${builderId} (${todayCount + 1}/${DAILY_LIMIT}). Primary model: ${PRIMARY_MODEL}`);

    // Try primary model, fall back to 4.6 if 4.7 is unavailable
    let modelUsed = PRIMARY_MODEL;
    let result;
    try {
      result = await callAnthropic({ apiKey: ANTHROPIC_API_KEY, model: PRIMARY_MODEL, systemPrompt: SYSTEM_PROMPT, userPrompt });
    } catch (err) {
      if (isModelUnavailableError(err)) {
        console.warn(`${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`);
        modelUsed = FALLBACK_MODEL;
        result = await callAnthropic({ apiKey: ANTHROPIC_API_KEY, model: FALLBACK_MODEL, systemPrompt: SYSTEM_PROMPT, userPrompt });
      } else {
        throw err;
      }
    }

    const { output, inputTokens, outputTokens } = result;
    const tokensUsed = inputTokens + outputTokens;

    // Persist
    const shareId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    const insertRow = {
      builder_id: builderId,
      title: (output.title || ideaTitleHint || 'Build plan').slice(0, 120),
      detailed_prompt: output.detailed_prompt_markdown,
      plan_markdown: output.plan_markdown,
      recommended_track: output.recommended_track,
      source_chat_excerpt: chatExcerpt || null,
      library_item_ids: libraryItemIds,
      model: modelUsed,
      tokens_used: tokensUsed,
      share_id: shareId,
    };

    const { data: saved, error: insertError } = await supabase
      .from('build_plans')
      .insert(insertRow)
      .select('id, title, detailed_prompt, plan_markdown, recommended_track, share_id, is_shared, created_at')
      .single();

    if (insertError || !saved) {
      console.error('build_plans insert error:', insertError);
      throw new Error('Failed to save build plan');
    }

    console.log(`Build plan saved: id=${saved.id} model=${modelUsed} tokens=${tokensUsed}`);

    return new Response(
      JSON.stringify({
        plan: saved,
        model: modelUsed,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
        remaining: DAILY_LIMIT - todayCount - 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('generate-build-plan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
