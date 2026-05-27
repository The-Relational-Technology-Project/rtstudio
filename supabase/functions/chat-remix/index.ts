import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions for contribution actions
const contributionTools = [
  {
    type: "function",
    function: {
      name: "submit_contribution_interest",
      description: "Notify the RTP team that a builder wants to contribute something to the commons. Only call this AFTER the builder agrees to connect with Deb about their contribution. This sends a summary to the team so Deb can follow up.",
      parameters: {
        type: "object",
        properties: {
          contributor_name: { type: "string", description: "The contributor's name" },
          contribution_type: { type: "string", enum: ["story", "tool", "idea", "other"], description: "What kind of contribution" },
          summary: { type: "string", description: "A brief summary of what they want to contribute and why" },
          neighborhood: { type: "string", description: "The contributor's neighborhood or community" }
        },
        required: ["contributor_name", "contribution_type", "summary"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "submit_gift_build_request",
      description: "Submit a builder's idea for a free Gift Build session with the RTP team — a deeper, hands-on build session beyond the standard build plan + steward intro. TIMING IS KEY: Only offer this AFTER the builder has a build plan in hand (or has clearly described a specific, buildable idea) AND has explicitly asked for more hands-on help building it. Do NOT offer early in the conversation, and do NOT offer as a default after the build plan — that's what steward connect is for.",
      parameters: {
        type: "object",
        properties: {
          idea_title: { type: "string", description: "A short title for the build idea" },
          idea_summary: { type: "string", description: "A clear summary of what the builder wants to create, including neighborhood context and who it's for" },
          builder_name: { type: "string", description: "The builder's name" },
          neighborhood: { type: "string", description: "The builder's neighborhood or community" }
        },
        required: ["idea_title", "idea_summary", "builder_name", "neighborhood"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_steward_connect",
      description: "Connect the builder with an RTP steward (Josh from the team) or with another builder in the network working on something adjacent. The builder's most recent build plan is shared automatically (this tool looks it up server-side). TIMING IS CRITICAL: Only call this AFTER a build plan has been generated (you'll see an assistant message saying 'Your build plan is ready below'), AND you've confirmed BOTH (a) which kind of connection the builder wants and (b) whether they want to share the chat history. Never assume share_chat_history — ask explicitly.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["rtp_steward", "adjacent_builder"],
            description: "Which kind of connection. 'rtp_steward' routes to Josh directly. 'adjacent_builder' asks Josh to find someone in the network building something similar."
          },
          share_chat_history: {
            type: "boolean",
            description: "Whether the builder explicitly agreed to share the chat history with the steward. Ask the builder before calling — never assume yes."
          },
          note: {
            type: "string",
            description: "Optional short note from the builder to include in the intro email."
          }
        },
        required: ["kind", "share_chat_history"],
        additionalProperties: false
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, demoMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get authenticated user from JWT token - don't trust client-provided userId
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userSupabase: ReturnType<typeof createClient> | null = null;
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      // Create a client with the user's JWT to verify identity and for user-context operations
      userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await userSupabase.auth.getUser();

      if (!authError && user?.id) {
        userId = user.id;
        userEmail = user.email || null;
        console.log('Verified user ID from JWT:', userId);
      }
    }

    // Rate limiting: 500 messages per day per user (skip for demo mode - handled client-side)
    const DAILY_MESSAGE_LIMIT = 500;
    
    if (userId && !demoMode) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      
      // Check current usage
      const { data: usageData, error: usageError } = await supabase
        .from('chat_usage')
        .select('message_count')
        .eq('user_id', userId)
        .eq('window_start', todayStart.toISOString())
        .maybeSingle();
      
      if (usageError) {
        console.error('Error checking rate limit:', usageError);
      }
      
      const currentCount = usageData?.message_count || 0;
      
      if (currentCount >= DAILY_MESSAGE_LIMIT) {
        console.log(`Rate limit exceeded for user ${userId}: ${currentCount}/${DAILY_MESSAGE_LIMIT}`);
        return new Response(
          JSON.stringify({ 
            error: 'Daily message limit reached. Please try again tomorrow.',
            limit: DAILY_MESSAGE_LIMIT,
            current: currentCount
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Increment usage counter (upsert)
      const { error: upsertError } = await supabase
        .from('chat_usage')
        .upsert(
          { 
            user_id: userId, 
            window_start: todayStart.toISOString(),
            message_count: currentCount + 1 
          },
          { onConflict: 'user_id,window_start' }
        );
      
      if (upsertError) {
        console.error('Error updating rate limit counter:', upsertError);
      } else {
        console.log(`Usage updated for user ${userId}: ${currentCount + 1}/${DAILY_MESSAGE_LIMIT}`);
      }
    }

    // Build authentication and profile context
    let profileContext = '';
    
    if (userId) {
      // User is authenticated - fetch their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, display_name, neighborhood, neighborhood_description, dreams, tech_familiarity, ai_coding_experience, local_tech_ecosystem')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile && !profileError) {
        const techComfortMap: Record<string, string> = {
          'new': 'New to tech',
          'learning': 'Learning',
          'comfortable': 'Comfortable',
          'experienced': 'Experienced'
        };
        const techComfortLabel = techComfortMap[profile.tech_familiarity || ''] || 'Learning';
        
        const aiExperienceMap: Record<string, string> = {
          'never': 'Never tried AI coding',
          'a_little': 'A little AI coding experience',
          'regular': 'Regular AI coding user',
          'daily': 'Daily AI coding user'
        };
        const aiExperienceLabel = aiExperienceMap[profile.ai_coding_experience || ''] || 'Getting started';

        // Build list of name variations to avoid self-referencing
        const userNames: string[] = [];
        if (profile.full_name) userNames.push(profile.full_name);
        if (profile.display_name && profile.display_name !== profile.full_name) userNames.push(profile.display_name);
        const namesList = userNames.length > 0 ? userNames.join(', ') : 'the current user';

        profileContext = `

AUTHENTICATED USER - This user IS signed in.

BUILDER CONTEXT (personalize your responses to this person):
- Full name: ${profile.full_name || 'Not provided'}
- Preferred name: ${profile.display_name || 'Builder'}
- Neighborhood: ${profile.neighborhood || 'Not specified'}${profile.neighborhood_description ? ` - ${profile.neighborhood_description}` : ''}
- Their dream: ${profile.dreams || 'Exploring possibilities'}
- Tech comfort: ${techComfortLabel}
- AI experience: ${aiExperienceLabel}
- Local tech ecosystem: ${(profile as any).local_tech_ecosystem || 'Not described yet'}

CRITICAL: This user is ${namesList}. When recommending people to connect with or stories/contributions to explore, DO NOT recommend they contact themselves or their own contributions. If you find library items attributed to them, acknowledge they created it rather than suggesting they "reach out to" themselves.

Use their preferred name naturally in conversation. Adjust technical explanations based on their comfort level.

USING PROFILE CONTEXT WELL (important — be light-touch but visibly grounded):
- Treat the profile above as already known. Reference populated fields by name in your first substantive response so the builder can tell you have their context (e.g., name their neighborhood by name when the request is local). Only ask follow-up questions about fields that are genuinely empty — and frame those questions narrowly around the missing piece, not as if you know nothing.
- When the builder's request is clearly tied to their neighborhood, community, or local context (e.g., "a connector site for my neighborhood," "a calendar for my block"), ALWAYS name their neighborhood in your reply before asking for more. Do not ask broad "what's your neighborhood like?" questions when you already know the place name — instead ask narrowly about what's actually missing (e.g., "I know you're in Five Points — what's one thing about the block you'd want this site to reflect?" or "Who do you most want this to reach first — long-time neighbors, newer arrivals, families?").
- When the request is generic or unrelated to place (e.g., a habit tracker, a recipe app, a generic utility), DO NOT shoehorn neighborhood, dreams, or ecosystem details in. Stay neutral.
- Apply the same judgment when proposing build directions: only weave in profile specifics if they genuinely fit the build. Otherwise stay neutral.
- If a profile field is empty or "Not specified" / "Not provided" / "Not described yet," do not invent details and do not call attention to the gap.

EXAMPLES (first reply when builder says "help me build a connector site for my neighborhood" and their profile has neighborhood="Five Points, Denver, CO" but no description):
- BAD: "I'd love to help! What's the vibe of your neighborhood, and what are you hoping people connect over?" (pretends to know nothing)
- GOOD: "For Five Points, a connector site could go a few directions — [LIBRARY_ITEM:prompt:...:Hyperlocal Neighbor Hubs] for a cozy village-scale hub, a lightweight events board, or a neighbor directory. Which feels closest? And one thing I don't have yet: who do you most want this to reach first — long-time residents, newer arrivals, a specific block?"
`;
        console.log('Profile context loaded for verified user:', userId, 'Names:', namesList);
      } else {
        // User is authenticated but profile fetch failed or no profile yet
        profileContext = `

AUTHENTICATED USER - This user IS signed in.
`;
        console.log('User authenticated but no profile data:', userId);
      }
    } else if (demoMode) {
      // Demo mode - visitor trying out Sidekick before signing up
      profileContext = `

DEMO MODE - This visitor is trying out Sidekick before signing up.
You can help them explore prompts, tools, and understand relational tech concepts.

IMPORTANT - STORIES IN DEMO MODE:
- Do NOT share specific story details, full story content, or personal details from community stories
- If a story is relevant to the conversation, mention that there are inspiring stories from neighbors in the library, but keep the details vague
- Use stories as a reason to encourage sign-up: "We have some wonderful stories from neighbors who've tried this - you can explore them when you create an account!"
- You can share prompt templates and tool information freely, just not story content

Do NOT offer to save commitments or add contributions - they need to create an account first.
Keep responses helpful and inviting. After a few exchanges, naturally mention that signing up unlocks the full Studio experience with features like reading community stories, saving commitments, and contributing to the library.
Do NOT mention library item links or IDs - the demo interface doesn't display them.
`;
      console.log('Demo mode - guest exploring');
    } else {
      // User is NOT authenticated (regular guest)
      profileContext = `

GUEST USER - This user is NOT signed in. You cannot save commitments to their profile. If they want to track commitments, politely let them know they need to sign in first (there's a profile icon in the top navigation).
`;
      console.log('User not authenticated - guest mode');
    }

    // Get the latest user message for context search
    const latestUserMessage = messages[messages.length - 1]?.content || '';

    // --- Hybrid search: always run both vector + keyword, merge results ---
    
    let relevantPrompts: any[] = [];
    let relevantStories: any[] = [];
    let relevantTools: any[] = [];

    // Track vector-matched IDs for deduplication
    const vectorMatchedIds = new Set<string>();

    // Hoisted so the commons search below can reuse the embedding without re-calling Lovable.
    let queryEmbedding: number[] | null = null;

    // 1. Vector similarity search
    if (LOVABLE_API_KEY && latestUserMessage.trim()) {
      try {
        const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-embedding-001",
            input: latestUserMessage,
            dimensions: 1536,
          }),
        });

        if (embResponse.ok) {
          const embData = await embResponse.json();
          queryEmbedding = embData.data[0].embedding;

          const { data: matches, error: matchError } = await supabase.rpc('match_library_items', {
            query_embedding: JSON.stringify(queryEmbedding),
            match_threshold: 0.15,
            match_count: 9,
          });

          if (!matchError && matches && matches.length > 0) {
            console.log('Vector search matches:', matches.map((m: any) => `${m.item_type}:${m.item_id} (${m.similarity.toFixed(3)})`));

            const storyIds = matches.filter((m: any) => m.item_type === 'story').map((m: any) => m.item_id);
            const promptIds = matches.filter((m: any) => m.item_type === 'prompt').map((m: any) => m.item_id);
            const toolMatchIds = matches.filter((m: any) => m.item_type === 'tool').map((m: any) => m.item_id);

            // Track all vector-matched IDs
            matches.forEach((m: any) => vectorMatchedIds.add(m.item_id));

            const [pRes, sRes, tRes] = await Promise.all([
              promptIds.length > 0
                ? supabase.from('prompts').select('id, title, category, description, example_prompt').in('id', promptIds)
                : Promise.resolve({ data: [] }),
              storyIds.length > 0
                ? supabase.from('stories').select('id, title, story_text, attribution, full_story_text').in('id', storyIds)
                : Promise.resolve({ data: [] }),
              toolMatchIds.length > 0
                ? supabase.from('tools').select('id, name, description, url').in('id', toolMatchIds)
                : Promise.resolve({ data: [] }),
            ]);

            relevantPrompts = (pRes.data || []).slice(0, 3);
            relevantStories = (sRes.data || []).slice(0, 3);
            relevantTools = (tRes.data || []).slice(0, 3);
          }
        } else {
          console.error('Lovable AI embeddings error:', embResponse.status, await embResponse.text());
        }
      } catch (embError) {
        console.error('Vector search failed:', embError);
      }
    }

    // 2. Keyword search — always run alongside vector, merge unique results
    if (latestUserMessage.trim()) {
      const stopWords = new Set([
        'i', 'want', 'a', 'the', 'to', 'for', 'of', 'and', 'or', 'in', 'on', 'at',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may',
        'this', 'that', 'these', 'those', 'it', 'its', 'my', 'our', 'let', 'lets',
        'remix', 'create', 'build', 'make', 'help', 'me', 'us', 'please'
      ]);
      
      const keywords = latestUserMessage
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 2 && !stopWords.has(word))
        .slice(0, 5);

      console.log('Keyword search (hybrid):', keywords);

      // Whitelist alphanumeric + spaces + hyphens; cap length to defend against PostgREST operator injection
      const sanitizeKeyword = (k: string) =>
        k.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 50);

      const safeKeywords = keywords.map(sanitizeKeyword).filter((k: string) => k.length >= 2);

      if (safeKeywords.length > 0) {
        const promptSearchConditions = safeKeywords.map((keyword: string) => {
          return `title.ilike.%${keyword}%,category.ilike.%${keyword}%,description.ilike.%${keyword}%`;
        }).join(',');

        const storySearchConditions = safeKeywords.map((keyword: string) => {
          return `title.ilike.%${keyword}%,story_text.ilike.%${keyword}%,attribution.ilike.%${keyword}%`;
        }).join(',');

        const toolSearchConditions = safeKeywords.map((keyword: string) => {
          return `name.ilike.%${keyword}%,description.ilike.%${keyword}%`;
        }).join(',');

        const [promptsResult, storiesResult, toolsResult] = await Promise.all([
          supabase.from('prompts').select('id, title, category, description, example_prompt').or(promptSearchConditions).limit(5),
          supabase.from('stories').select('id, title, story_text, attribution, full_story_text').or(storySearchConditions).limit(5),
          supabase.from('tools').select('id, name, description, url').or(toolSearchConditions).limit(5)
        ]);

        const kwPrompts = promptsResult.data || [];
        const kwStories = storiesResult.data || [];
        const kwTools = toolsResult.data || [];

        // Merge: add keyword-only items not already found by vector search
        const existingPromptIds = new Set(relevantPrompts.map((p: any) => p.id));
        const existingStoryIds = new Set(relevantStories.map((s: any) => s.id));
        const existingToolIds = new Set(relevantTools.map((t: any) => t.id));

        for (const p of kwPrompts) {
          if (!existingPromptIds.has(p.id) && relevantPrompts.length < 3) {
            relevantPrompts.push(p);
            console.log(`Keyword added prompt: ${p.title}`);
          }
        }
        for (const s of kwStories) {
          if (!existingStoryIds.has(s.id) && relevantStories.length < 3) {
            relevantStories.push(s);
            console.log(`Keyword added story: ${s.title}`);
          }
        }
        for (const t of kwTools) {
          if (!existingToolIds.has(t.id) && relevantTools.length < 3) {
            relevantTools.push(t);
            console.log(`Keyword added tool: ${t.name}`);
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // 3. Commons search — query the RTP global commons.
    // Vector search is primary (semantic similarity finds Repair Cafe from
    // "fix-it fair" — text search misses this since the tokens don't share
    // stems). Falls back to text search if no embedding is available.
    // ------------------------------------------------------------------
    const COMMONS_URL = Deno.env.get('RTP_COMMONS_URL') ?? 'https://odowkowcinyoxejyzhwl.supabase.co';
    const COMMONS_ANON_KEY = Deno.env.get('RTP_COMMONS_ANON_KEY')
      ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kb3drb3djaW55b3hlanl6aHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTE5MzksImV4cCI6MjA3MDI2NzkzOX0.2Y2Dw66ORJ5DyBA11H5ziNFtdH1dG9BcOmFWYSicTSc';

    let relevantCommons: Array<{
      slug: string;
      kind: string;
      title: string;
      summary: string | null;
      attribution: Record<string, unknown> | null;
      source_studio_slug: string | null;
      source_url: string | null;
      tags: string[] | null;
      similarity?: number;
    }> = [];

    if (latestUserMessage.trim()) {
      try {
        const commonsHeaders = {
          'apikey': COMMONS_ANON_KEY,
          'Authorization': `Bearer ${COMMONS_ANON_KEY}`,
          'Content-Type': 'application/json',
        };

        const ALL_KINDS = ['recipe', 'framework', 'methodology', 'reference', 'tool', 'story'];
        let commonsMatches: any[] = [];

        // Vector search via match_commons_items() — preferred, semantic
        if (queryEmbedding) {
          try {
            const vecRes = await fetch(`${COMMONS_URL}/rest/v1/rpc/match_commons_items`, {
              method: 'POST',
              headers: commonsHeaders,
              body: JSON.stringify({
                query_embedding: JSON.stringify(queryEmbedding),
                match_threshold: 0.25,
                match_count: 8,
                filter_kinds: ALL_KINDS,
              }),
            });
            if (vecRes.ok) {
              commonsMatches = await vecRes.json();
              console.log(`Commons vector search: ${commonsMatches.length} matches`,
                commonsMatches.map((m: any) => `${m.kind}:${m.slug}(${m.similarity?.toFixed(3)})`).join(', '));
            } else {
              console.error('Commons vector search failed:', vecRes.status, await vecRes.text());
            }
          } catch (e) {
            console.error('Commons vector search threw:', e);
          }
        }

        // Fall back to text search if vector returned nothing (or no embedding)
        if (commonsMatches.length === 0) {
          const textRes = await fetch(`${COMMONS_URL}/rest/v1/rpc/search_commons_items`, {
            method: 'POST',
            headers: commonsHeaders,
            body: JSON.stringify({
              query_text: latestUserMessage.slice(0, 500),
              match_count: 8,
              filter_kinds: ALL_KINDS,
            }),
          });
          if (textRes.ok) {
            commonsMatches = await textRes.json();
            console.log(`Commons text search (fallback): ${commonsMatches.length} matches`);
          } else {
            console.error('Commons text search failed:', textRes.status, await textRes.text());
          }
        }

        if (commonsMatches.length > 0) {
          // Hydrate body/source_url via a follow-up select
          const slugs = commonsMatches.map(m => m.slug);
          const kinds = [...new Set(commonsMatches.map(m => m.kind))];
          const slugsList = slugs.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
          const kindsList = kinds.map(k => `"${k}"`).join(',');
          const hydrateRes = await fetch(
            `${COMMONS_URL}/rest/v1/commons_items?select=slug,kind,title,summary,body,attribution,source_studio_slug,source_url,tags&slug=in.(${slugsList})&kind=in.(${kindsList})&status=eq.canonical`,
            { headers: commonsHeaders }
          );
          if (hydrateRes.ok) {
            const hydrated = await hydrateRes.json() as any[];
            const bySlugKind = new Map<string, any>();
            for (const h of hydrated) bySlugKind.set(`${h.kind}:${h.slug}`, h);
            relevantCommons = commonsMatches
              .map((m: any) => {
                const item = bySlugKind.get(`${m.kind}:${m.slug}`);
                return item ? { ...item, similarity: m.similarity } : null;
              })
              .filter(Boolean)
              .slice(0, 6); // cap at 6 commons items to balance against local
          }
        }
      } catch (commonsError) {
        console.error('Commons search failed (non-fatal):', commonsError);
      }
    }

    // Build library context
    let libraryContext = '';
    
    if (relevantPrompts.length > 0) {
      libraryContext += `\n\nRELEVANT PROMPTS FROM THE LIBRARY:\n${relevantPrompts.map(p => {
        return `\n---\nID: ${p.id}\nTitle: ${p.title}\nCategory: ${p.category}\nDescription: ${p.description || 'N/A'}\nExample Prompt:\n${p.example_prompt}\n---`;
      }).join('\n')}`;
    }

    if (relevantStories.length > 0) {
      if (demoMode) {
        libraryContext += `\n\nNOTE: There are ${relevantStories.length} relevant community stories in the library that relate to this topic. Encourage the visitor to sign up to read the full stories from neighbors who've tried similar things.`;
      } else {
        libraryContext += `\n\nRELEVANT STORIES FROM THE LIBRARY:\n${relevantStories.map(s => {
          return `\n---\nID: ${s.id}\nTitle: ${s.title || 'Untitled'}\nAttribution: ${s.attribution || 'Anonymous'}\nStory:\n${s.full_story_text || s.story_text}\n---`;
        }).join('\n')}`;
      }
    }

    if (relevantTools.length > 0) {
      libraryContext += `\n\nRELEVANT TOOLS FROM THE LIBRARY:\n${relevantTools.map(t => {
        return `\n---\nID: ${t.id}\nName: ${t.name}\nDescription: ${t.description}\nURL: ${t.url}\n---`;
      }).join('\n')}`;
    }

    if (relevantCommons.length > 0) {
      libraryContext += `\n\nRELEVANT ITEMS FROM THE RTP GLOBAL COMMONS:
These are items from the shared library across the RTP network — neighborhood recipes (block parties, mutual aid pods, repair cafes, etc.), RTP frameworks and methodology, and field references to practitioners' work. They are NOT in this Studio's local library — they live in the shared commons.

When mentioning a commons item in your reply, do NOT use the [LIBRARY_ITEM:...] marker (those are for local items only). Instead, mention it by title in plain text, attribute the source when available, and include the source URL if the user might want to read more.
${relevantCommons.map(c => {
  const attr = c.attribution || {};
  const attrParts: string[] = [];
  if (attr.name) attrParts.push(String(attr.name));
  if (attr.neighborhood) attrParts.push(String(attr.neighborhood));
  if (attrParts.length === 0 && c.source_studio_slug && c.source_studio_slug !== 'rtp-canonical') {
    attrParts.push(`Contributed by ${c.source_studio_slug}`);
  }
  const attribution = attrParts.length > 0 ? attrParts.join(' · ') : 'RTP commons';
  // Trim body to a useful excerpt (1200 chars max per item to keep prompt manageable)
  const bodyExcerpt = c.body ? c.body.slice(0, 1200) + (c.body.length > 1200 ? '\n...[truncated]' : '') : '';
  return `\n---\nKind: ${c.kind}\nTitle: ${c.title}\nAttribution: ${attribution}${c.source_url ? `\nSource URL: ${c.source_url}` : ''}\nSummary: ${c.summary || ''}${bodyExcerpt ? `\nExcerpt:\n${bodyExcerpt}` : ''}\n---`;
}).join('\n')}`;
    }

    // --- Relational Tech Network RSS feed (cached) ---
    let networkContext = '';
    try {
      const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

      const { data: cached } = await supabase
        .from('network_feed_cache')
        .select('items, fetched_at')
        .eq('id', 'latest')
        .maybeSingle();

      let feedItems: any[] = [];
      const cacheAge = cached?.fetched_at ? Date.now() - new Date(cached.fetched_at).getTime() : Infinity;

      if (cached && cacheAge < CACHE_TTL_MS) {
        feedItems = cached.items || [];
        console.log('Network feed: using cache (' + feedItems.length + ' items)');
      } else {
        console.log('Network feed: fetching fresh RSS');
        const feedRes = await fetch('https://updates.relationaltechproject.org/feed.xml', {
          signal: AbortSignal.timeout(5000),
        });
        if (feedRes.ok) {
          const xmlText = await feedRes.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'text/xml');
          const items = doc?.querySelectorAll?.('item') || [];

          feedItems = [];
          for (let i = 0; i < Math.min(items.length, 15); i++) {
            const item = items[i];
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            feedItems.push({ title, description: description.slice(0, 300), link, pubDate });
          }

          // Upsert cache
          await supabase.from('network_feed_cache').upsert({
            id: 'latest',
            items: feedItems,
            fetched_at: new Date().toISOString(),
          });
          console.log('Network feed: cached ' + feedItems.length + ' items');
        } else {
          console.error('Network feed fetch failed:', feedRes.status);
          feedItems = cached?.items || [];
        }
      }

      if (feedItems.length > 0) {
        const recentItems = feedItems.slice(0, 10);
        networkContext = `\n\nRELATIONAL TECH NETWORK UPDATES (from the open-source ecosystem):
These are recent updates from projects in the Relational Tech Network — other builders creating open-source neighborhood tools. Reference these when relevant to show what's growing in the ecosystem.
${recentItems.map((item: any) => {
  const date = item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  return `\n- ${item.title}${date ? ' (' + date + ')' : ''}: ${item.description}${item.link ? ' — ' + item.link : ''}`;
}).join('')}`;
      }
    } catch (feedError) {
      console.error('Network feed error (non-fatal):', feedError);
    }

    const systemPrompt = `You are Sidekick, an AI assistant for the Relational Technology Studio. You help people explore stories, prompts, and tools from the library, guide them in creating relational tech for their neighborhoods, AND act as a commons librarian who helps people contribute their own gifts to the shared library.

CRITICAL: Do not use markdown formatting in your responses. Write in plain text only - no asterisks, no hashtags, no special formatting. Use simple line breaks and natural language.

ABOUT RELATIONAL TECHNOLOGY:
Relational tech helps us reconnect with the people around us in the places where we live. It helps people care for each other, collaborate, and build trust. The process of co-creating and sharing relational tech deepens relationships.

Relational technology is NOT about endless feeds, addictive features, or growth at all costs. It's about thoughtfully crafted tools that help neighbors care, collaborate, and build trust. The best relational tech is itself co-created in a way that deepens relationships with people around us.

HABITS OF THE RELATIONAL TECH HEART:
- Start with relationships and real local needs and assets
- Learn from those around us: neighborhood elders and kids, neighbors who speak other languages, neighbors with different values, neighbors who aren't human
- Like a forest, diversity is resilience (and a source of beauty and creativity)
- Don't aim for perfection, strive for enough relevance to receive the gift of feedback
- Measure success by how much trust and care is renewed
- Conflict means someone cares
- Assume the tool will change, so design for more stewardship and shared ownership
- Welcome messiness and wonder

LIBRARY ITEMS ARE ALWAYS IN-SCOPE:
Every story, prompt, and tool in the Studio library has been intentionally curated by the stewards — including examples from larger civic, cooperative, deliberative, or international contexts (citizens' juries, co-ops, participatory budgeting, etc.). Never tell a builder that a library item is "outside your focus" or redirect them away from it. Engage with it directly: explain what's interesting about it, surface the underlying patterns (deliberation, mutual aid, shared stewardship, etc.), and then — if the builder is interested — help them translate those patterns into something neighborhood-scale. The hyperlocal lens is a translation tool, not a gatekeeper.

OFFER 2–3 BUILD DIRECTIONS BEFORE SIGNALING READINESS:
Once you understand the builder's neighborhood and what they're trying to do, do NOT collapse onto a single direction. Briefly surface 2–3 distinct directions they could take — e.g. different library tools, different scopes (one block vs. whole neighborhood), or different formats (digital bulletin board vs. event series vs. directory vs. deliberation circle). Reference relevant library items inline using [LIBRARY_ITEM:...] markers. Keep it lightweight — a short paragraph or 3 bulleted options, not a long menu — and ask which direction resonates before signaling readiness with [READY_FOR_BUILD_PLAN]. The build plan itself is written by Opus from the conversation, not by you.

YOUR CAPABILITIES:
1. EXPLORE THE LIBRARY: Help users browse and understand stories, prompts, and tools
   - Answer questions about specific stories or tools
   - Make connections between different library items
   - Share relevant examples when asked
   - Treat every library item as a legitimate starting point, regardless of its original scale

2. EXPLORE BUILD DIRECTIONS: Help users land on a concrete idea for a tool that fits their neighborhood
   - Ask about their neighborhood's context (location, community characteristics, unique needs)
   - Ask what they'd like to add, change, or customize about the tool
   - Gather enough detail about their vision and constraints
   - Offer 2–3 distinct possible directions and let the builder pick one
   - Suggest combinations with other relational tech tools if relevant (but don't be pushy)
   - When the builder has settled on a direction AND shared enough specifics to draft from, signal readiness by emitting [READY_FOR_BUILD_PLAN] — Opus writes the polished prompt and plan from the conversation. You never author the prompt yourself.

3. RECEIVE CONTRIBUTIONS (Relational Approach):
   When someone wants to share a story, idea, tool, or anything else with the commons, take a slow, relational approach. Do NOT jump into drafting or submitting content directly.
   
   RECOGNIZING CONTRIBUTION INTENT - Look for phrases like:
   - "We did something cool in our neighborhood..."
   - "I made a tool that..."
   - "Here's something that worked for us..."
   - "I want to share a story about..."
   - "I found a great tool for..."
   - Or any time someone shares an experience, idea, or resource that could help others
   
   THE CONTRIBUTION FLOW:
   a) LISTEN & APPRECIATE: Thank them for wanting to share. Ask a few questions to understand what they want to contribute and why it matters to them.
   
   b) OFFER A CONVERSATION WITH DEB: After gathering some context, say something like:
      "Would you be open to chatting with our steward, Deb, about this? She can help shape your contribution and make sure it lands well in the commons."
   
   c) IF THEY SAY YES: Summarize the contribution idea and let them know you'll connect them with Deb. The summary will be sent to the team so Deb can follow up.
   
   d) DO NOT directly submit stories, prompts, or tools to the database from chat. All contributions go through a human conversation first.

YOUR STYLE:
- Be warm, conversational, and genuinely curious about their neighborhood
- Keep responses focused and helpful - no fluff
- Never open with flattery like "I love that idea!" or "Great question!" — jump straight into being helpful. You're a collaborator, not a cheerleader.
- Never use the word "template" — say "prompt" or "starting point"
- Ask clarifying questions when needed
- You do NOT deliver prompts in chat. Prompts are written by Opus via the Create build plan action — your job is to signal readiness with [READY_FOR_BUILD_PLAN], not to author the prompt.
- Help builders see how patterns from any scale — including larger civic or cooperative examples in the library — can be translated into small, hyperlocal, neighbor-scale tools
- Remember: these are village-scale tools built by and for neighbors
- When receiving contributions, honor their voice and context
- If the conversation shifts to a completely different topic or tool, suggest: "Want to start a fresh conversation for this? You can click New Chat to start clean."

IMPORTANT: When referencing specific library items from the context above, use this format in your response:
[LIBRARY_ITEM:type:id:title]

For example:
- [LIBRARY_ITEM:story:123e4567-e89b-12d3-a456-426614174000:Community Garden Story]
- [LIBRARY_ITEM:prompt:987fcdeb-51a2-43f7-b789-123456789abc:Block Party Prompt]
- [LIBRARY_ITEM:tool:456def78-90ab-12cd-ef34-567890abcdef:Neighborhood Directory]

Include 2-3 relevant library item markers naturally in your responses when you're discussing items from the context. This allows users to see preview cards and easily navigate to the full items in the library.

IMPORTANT — DO NOT WRITE PROMPTS IN CHAT:

Your job is to gather context, propose directions, and signal readiness — NOT to author prompts. There is a dedicated "Create build plan" action that calls a more capable model (Claude Opus) to write the polished prompt and plan from the conversation itself. The chat IS the brief.

This means:
- Never wrap anything in ---PROMPT_START--- / ---PROMPT_END--- markers. That mechanism is retired.
- Never write a draft prompt, a sample prompt, or a "here is a prompt you can use to build this" block in chat — even if the builder seems to want one. They get the prompt from the Create build plan action, not from you.
- Never tell the builder to "copy this prompt into Lovable / Claude Code / Dyad" before the build plan has been generated. Those tools are downstream of Create build plan, not parallel to it.
- Never describe the FULL UX, primary/secondary screens, data models, or other prompt-spec details in chat. That's Opus's job. You stay at the conversational layer.

BANNED PHRASES (do not say anything resembling these — they are artifacts of the old retired flow):
- "Here is a prompt you can use to build this"
- "Here's a prompt to get you started"
- "You can build a prototype here in Studio"
- "take this prompt to Claude Code or Lovable"
- "it'll show the main flow working with other sections stubbed"
- Any tip about "replace any AI-generated placeholder text" or "use real photos of your neighbors" — that authenticity guidance belongs IN the build plan Opus writes, not in chat.

If you find yourself about to write any of the above, stop and instead emit the [READY_FOR_BUILD_PLAN] sentinel per the section below.

What you DO at the conversational layer:
- Gather context: where they are, who they want to reach, what's already in place, what they've tried.
- Offer 2–3 possible directions when they describe an idea, drawing on library items and the global commons by reference (using [LIBRARY_ITEM:...] markers as before).
- Confirm which direction they want to pursue, and tease out any specifics that would shape it (audience, scope, what feels good, what doesn't).
- Gently remind them along the way that the tool will likely change, and that's okay.

WHEN YOU HAVE ENOUGH CONTEXT TO BUILD:
Once the builder has confirmed a direction AND shared enough specifics that you (or the next model) could draft a real prompt from this conversation, do TWO things in your message:
1. Say plainly: "I think we have enough to turn this into a real plan. Tap **Create build plan** below — that'll generate a detailed prompt and a builder plan, picked for your level. The plan also walks you through sharing a first version with one neighbor."
2. End the message with the sentinel `[READY_FOR_BUILD_PLAN]` on its own line. The UI uses this to render the action button. The sentinel is mandatory — without it the button doesn't appear, and the builder is stuck.

Then stop. Do NOT also offer Gift Build, do NOT also paste a prompt, do NOT also tell them where to take it. Just the readiness line + sentinel. Wait for the builder to tap the button. If they want to refine first, drop back into conversation; you can emit `[READY_FOR_BUILD_PLAN]` again later when the next iteration feels ready.

IMPORTANT FOR CONTRIBUTIONS:
- Take a slow, relational approach — no direct database submissions
- After gathering context about the contribution, offer to connect them with Deb
- If they agree, summarize the contribution and call submit_contribution_interest to notify the team
- Each contribution should be shaped through human conversation

4. GIFT BUILD REQUESTS:
   Gift Builds are for builders who want hands-on help BEYOND the build plan — Josh sits with them and walks through an initial implementation together. This is heavier-touch than the standard steward intro.

   TIMING IS KEY — Gift Builds come AFTER the build plan flow, not in competition with it. Do NOT offer this:
   - Before a build plan has been generated. The standard path is: gather context → Create build plan → review the plan → steward intro if helpful. Gift Build is a separate, deeper offer.
   - Whenever the builder seems satisfied with the plan + steward intro. Don't push.

   Offer this ONLY when the builder explicitly asks for hands-on help bringing the plan to life, OR explicitly says they're stuck and want someone to build alongside them.

   HARD GATE: A build plan must already exist in this conversation (you'll see an assistant message saying "Your build plan is ready below"). If it doesn't, do NOT offer Gift Build — emit [READY_FOR_BUILD_PLAN] instead and let the build plan flow happen first.

   THE OFFER (only after the gate above is satisfied AND the builder asked for more hands-on help): "If you'd like hands-on help bringing this to life, I can submit a Gift Build request to Josh from the RTP team. He'll walk you through an initial build and help you get set up with the right tools — completely free. Want me to send this over?"

   After submission, share the scheduling link: https://cal.com/joshnesbit/
   Encourage them to book at least a week out so Josh can review their idea first.

   If someone asks about Gift Builds before they have an idea ready, suggest they develop their concept first — either by chatting with you or exploring the library. You can also point them to the Get Support page where they can request a Gift Build directly.

5. NETWORK AWARENESS: You have access to recent updates from the Relational Tech Network —
   open-source projects tagged "relational-tech" on GitHub. When relevant, mention what other
   builders are creating across the ecosystem. This helps builders feel connected to a larger
   movement and discover patterns and ideas from other neighborhoods.

6. THE RTP GLOBAL COMMONS: Beyond this Studio's local library, you can also draw on the RTP
   shared commons — a network-wide library that includes neighborhood recipes (block parties,
   mutual aid pods, repair cafes, restorative circles, etc.), RTP frameworks and methodology
   docs, and field references to practitioners' work (Block Party USA, Priya Parker, Dean Spade,
   ABCD Institute, microsolidarity, and many more).

   IMPORTANT: When items appear in the context below under "RELEVANT ITEMS FROM THE RTP GLOBAL
   COMMONS", they are AS RELEVANT as local library items — surface them in your response.
   Do not silently ignore them just because they don't have UI cards. If a commons recipe,
   framework, or reference matches the builder's question, mention it by title with attribution
   and the source URL. The commons is often where the most directly applicable practitioner
   work lives — especially for recipes (how-tos for specific practices like repair cafes,
   skillshares, block parties) and references to organizations and practitioners.

   FORMAT DISTINCTION:
   - LOCAL library items (stories, prompts, tools): use the [LIBRARY_ITEM:type:id:title] marker
     so the UI can render preview cards and the builder can navigate to them in the library.
   - COMMONS items: do NOT use the marker. Reference them in plain text by their title, with
     the source attribution and the source URL on a separate line when available. The user can
     click the URL to read more.

   Example of mixing both well:
     "For the day-of queue management, the [LIBRARY_ITEM:tool:abc-123:Skill Directory] tool
     could work nicely. There's also a 'Repair Cafe' recipe in the broader commons that maps
     directly to your fix-it fair — Martine Postma started the first one in Amsterdam in 2009,
     and there's a starter kit from the Repair Cafe Foundation:
     https://www.repaircafe.org/en/visit/"

   The commons is especially useful when the builder asks about a practice or pattern that
   isn't yet in this Studio's local library (e.g. "how do I run a repair cafe?", "what's
   microsolidarity?", "how do mutual aid pods stay sustainable?"). Lead with the practitioner's
   work, then translate to the builder's neighborhood scale.

7. STEWARD CONNECT (after a build plan has been generated):
   When the conversation includes an assistant message saying "Your build plan is ready below" (or similar), the builder just finished generating a build plan. At that point, proactively offer the steward-connect path — this is a core part of what Studio is for.

   THE FLOW (do not skip steps, do not collapse them):
   - Step 1 (offer the choice): "Want me to introduce you to an RTP steward (Josh from the team), or to someone in the network building something adjacent? Either is optional."
   - Step 2 (only after they pick): confirm shared content plainly — "I'll share the detailed prompt and plan with Josh."
   - Step 3 (always ask, never assume): "Is it okay to share our chat history too? Totally fine if not."
   - Step 4: once both the kind and the chat-history answer are confirmed, call request_steward_connect with the chosen kind, share_chat_history boolean, and (optional) a short note if the builder said anything they'd like included.
   - Step 5: deliver the tool's response message verbatim. The tool returns warm copy already.

   IMPORTANT:
   - NEVER assume share_chat_history is true. Always ask. Builders may have private context in the chat.
   - If the builder declines the intro entirely, that's fine — don't push. Move to the commitments invitation below.
   - If the builder asks for the intro before a build plan has been generated, encourage them to create the build plan first so there's something to share.
   - For 'adjacent_builder' kind, do not try to name a specific person — Josh hand-picks the match.

8. COMMITMENTS AT PLAN TIME:
   After the steward conversation (or if the builder declined the intro), invite them to lock in next steps:
   "If there are concrete next steps for you — 'show this to Maya by Saturday,' 'sign up for Lovable,' 'paste the prompt into Claude Code tomorrow morning' — I can save those to your profile so you don't lose them."
   Builders manage commitments manually on their profile (per the COMMITMENTS section below). Your job at this stage is to nudge, name a few concrete options that fit their plan, and acknowledge anything they share.

COMMITMENTS:
When users express intentions, plans, or commitments during conversation (like "I'm going to talk to my neighbor" or "I want to host a block party"):
- Encourage them warmly and acknowledge the commitment
- Help them phrase it clearly if needed
- Let them know: "You can add this to your Commitments list on your Profile page to track it - and you'll earn a serviceberry when you complete it!"
- Do NOT try to save commitments for them - they manage their own commitments manually on their Profile page

Begin by understanding what they're looking for — whether that's exploring the library, landing on a build direction for their neighborhood, or contributing something new to the commons.${profileContext}${libraryContext}${networkContext}`;

    // Make the AI call with tools enabled
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        // Only include tools when NOT in demo mode - prevents database writes from demo
        ...(demoMode ? {} : { tools: contributionTools, tool_choice: 'auto' })
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    // Check if the AI wants to call a tool
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      console.log('Tool call requested:', functionName, args);
      
      if (functionName === 'submit_contribution_interest') {
        // Handle contribution interest - send email to Deb
        console.log('Contribution interest:', args);

        let contributorEmail = userEmail || '';
        let contributorUsername = '';
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('email, display_name, full_name').eq('id', userId).maybeSingle();
          contributorEmail = contributorEmail || profile?.email || '';
          contributorUsername = profile?.display_name || profile?.full_name || '';
        }

        const recentMessages = messages.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n');

        try {
          const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
          if (RESEND_API_KEY) {
            const { Resend } = await import('https://esm.sh/resend@2.0.0');
            const resendClient = new Resend(RESEND_API_KEY);
            const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });

            await resendClient.emails.send({
              from: "Relational Tech Studio <notifications@relationaltechproject.org>",
              to: ["deborah@relationaltechproject.org"],
              subject: `🌿 Contribution Interest: ${args.contribution_type} from ${args.contributor_name}`,
              html: `
                <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px;">
                  <h2 style="color: #3d3129; margin-bottom: 16px;">New Contribution Interest</h2>
                  <p style="color: #7a6d61; line-height: 1.6;">A builder would like to chat about contributing to the commons.</p>
                  <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${args.contributor_name}</p>
                    ${contributorEmail ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${contributorEmail}</p>` : ''}
                    ${contributorUsername ? `<p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${contributorUsername}</p>` : ''}
                    ${args.neighborhood ? `<p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${args.neighborhood}</p>` : ''}
                    <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${args.contribution_type}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Summary:</strong></p>
                    <p style="margin: 0 0 8px 0; color: #3d3129; line-height: 1.6;">${args.summary}</p>
                    <p style="margin: 12px 0 8px 0;"><strong>Conversation context:</strong></p>
                    <p style="margin: 0; color: #7a6d61; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${recentMessages}</p>
                    <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;"><strong>Submitted:</strong> ${timestamp} ET</p>
                  </div>
                  <p style="color: #7a6d61; font-size: 14px;">— Relational Tech Studio</p>
                </div>
              `,
            });
            console.log('Contribution interest email sent to Deb');
          }
        } catch (emailError) {
          console.error('Contribution interest email error (non-fatal):', emailError);
        }

        return new Response(
          JSON.stringify({ 
            response: `I've let Deb know about your interest in contributing. She'll reach out to you soon to chat about your ${args.contribution_type} and help shape it for the commons. Thank you for wanting to share!`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (functionName === 'submit_gift_build_request') {
        // Handle gift build request
        console.log('Gift build request:', args);
        
        let builderEmail = '';
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
          builderEmail = profile?.email || '';
        }

        const recentMessages = messages.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n');
        
        const giftBuildPayload = {
          builder_name: args.builder_name,
          builder_email: builderEmail,
          neighborhood: args.neighborhood,
          idea_title: args.idea_title,
          idea_summary: args.idea_summary,
          conversation_context: recentMessages,
          source: 'sidekick'
        };

        const { error: giftInsertError } = await supabase.from('gift_build_requests').insert({
          ...giftBuildPayload,
          user_id: userId
        });

        if (giftInsertError) {
          console.error('Gift build insert error:', giftInsertError);
          return new Response(
            JSON.stringify({ response: `I ran into a technical issue submitting your Gift Build request. Would you like to try again?` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
          if (RESEND_API_KEY) {
            const { Resend } = await import('https://esm.sh/resend@2.0.0');
            const resendClient = new Resend(RESEND_API_KEY);
            const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
            
            await resendClient.emails.send({
              from: "Relational Tech Studio <notifications@relationaltechproject.org>",
              to: ["josh@relationaltechproject.org"],
              subject: `🎁 Gift Build Request: ${args.idea_title}`,
              html: `
                <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px;">
                  <h2 style="color: #3d3129; margin-bottom: 16px;">Gift Build Request</h2>
                  <p style="color: #7a6d61; line-height: 1.6;">A builder wants hands-on help bringing an idea to life!</p>
                  <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Builder:</strong> ${args.builder_name}</p>
                    ${builderEmail ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${builderEmail}</p>` : ''}
                    <p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${args.neighborhood}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Idea:</strong> ${args.idea_title}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Description:</strong></p>
                    <p style="margin: 0 0 8px 0; color: #3d3129; line-height: 1.6;">${args.idea_summary}</p>
                    <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;"><strong>Source:</strong> Sidekick chat · <strong>Submitted:</strong> ${timestamp} ET</p>
                  </div>
                  <p style="color: #7a6d61; font-size: 14px;">— Relational Tech Studio</p>
                </div>
              `,
            });
            console.log('Gift build email sent');
          }
        } catch (emailError) {
          console.error('Gift build email error (non-fatal):', emailError);
        }

        return new Response(
          JSON.stringify({
            response: `Your Gift Build request has been sent to Josh from the RTP team! He'll review your idea -- "${args.idea_title}" -- and prepare for your session.\n\nNext step: Book a jam session so Josh can walk you through an initial build and get you set up with the right tools. We recommend booking at least a week out so he has time to review your idea.\n\nSchedule here: https://cal.com/joshnesbit/\n\nThis is going to be great!`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (functionName === 'request_steward_connect') {
        console.log('Steward connect request:', args);

        if (!userId || !authHeader) {
          return new Response(
            JSON.stringify({ response: "I'll need you to be signed in to send a steward intro. Could you sign in and we'll try again?" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find the most recent build plan for this builder
        const sinceISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentPlan } = await supabase
          .from('build_plans')
          .select('id, title')
          .eq('builder_id', userId)
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!recentPlan) {
          return new Response(
            JSON.stringify({ response: "I don't see a recent build plan to share yet. Want to create one first? Once we land on a prompt, tap **Create build plan** and then we can loop a steward in." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const kind: 'rtp_steward' | 'adjacent_builder' = args.kind === 'adjacent_builder' ? 'adjacent_builder' : 'rtp_steward';
        const shareChat = args.share_chat_history === true;
        const note = (args.note || '').toString().trim();

        const chatExcerpt = shareChat
          ? messages.slice(-12).map((m: any) => `${m.role === 'user' ? 'Builder' : 'Sidekick'}: ${m.content}`).join('\n\n')
          : null;

        try {
          const notifyRes = await fetch(`${SUPABASE_URL}/functions/v1/notify-steward-connect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              build_plan_id: (recentPlan as any).id,
              kind,
              share_chat_history: shareChat,
              chat_excerpt: chatExcerpt,
              note: note || undefined,
            }),
          });

          if (!notifyRes.ok) {
            const errBody = await notifyRes.text().catch(() => '');
            console.error('notify-steward-connect failed:', notifyRes.status, errBody);
            return new Response(
              JSON.stringify({ response: "I hit a snag sending the intro just now. Want to try again in a moment?" }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (notifyErr) {
          console.error('notify-steward-connect exception:', notifyErr);
          return new Response(
            JSON.stringify({ response: "I hit a snag sending the intro just now. Want to try again in a moment?" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const chatLine = shareChat
          ? "He has our conversation as context, too."
          : "Our chat stayed between us — Josh will start fresh from the plan.";

        const responseText = kind === 'rtp_steward'
          ? `I've shared your plan with Josh from the RTP team. ${chatLine} He'll reach out by email soon — and if you want to grab a time directly, you can book here: https://cal.com/joshnesbit/`
          : `I've sent your plan over to Josh, and he'll look for someone in the network building something adjacent and make the intro by email. ${chatLine}`;

        return new Response(
          JSON.stringify({ response: responseText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unknown tool call
      return new Response(
        JSON.stringify({ response: choice.message.content || "I'm not sure how to handle that. Could you try again?" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    
    // Regular response (no tool call)
    const assistantMessage = choice.message.content;

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-remix function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});