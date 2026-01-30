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
      name: "submit_story",
      description: "Submit a new story to the commons library after user gives explicit consent. Only call this AFTER the user confirms they want to add the story.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "A clear, inviting title for the story" },
          story_text: { type: "string", description: "A short summary (1-2 sentences) that captures the essence" },
          full_story_text: { type: "string", description: "The complete story with rich context and details" },
          attribution: { type: "string", description: "Who is sharing this and where (e.g., 'Maria from Sunset Park, Brooklyn')" }
        },
        required: ["title", "story_text", "full_story_text", "attribution"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "submit_prompt",
      description: "Submit a new prompt template to the commons library after user gives explicit consent. Only call this AFTER the user confirms they want to add the prompt.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "A clear, descriptive title for the prompt" },
          category: { type: "string", description: "Category like 'Gathering', 'Communication', 'Resource Sharing', 'Mutual Aid', etc." },
          description: { type: "string", description: "Brief description of what this prompt helps create" },
          example_prompt: { type: "string", description: "The full prompt text that can be used in AI builders" }
        },
        required: ["title", "category", "description", "example_prompt"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "submit_tool",
      description: "Submit a new tool recommendation to the commons library after user gives explicit consent. Only call this AFTER the user confirms they want to add the tool.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the tool" },
          description: { type: "string", description: "How this tool helps with relational tech, including context from the contributor" },
          url: { type: "string", description: "URL to the tool or resource" }
        },
        required: ["name", "description", "url"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_commitment",
      description: "Record a commitment the user has made during conversation. Only call this AFTER the user confirms they want to track this commitment.",
      parameters: {
        type: "object",
        properties: {
          commitment_text: { 
            type: "string", 
            description: "The commitment in the user's own words" 
          },
          context: { 
            type: "string", 
            description: "Brief context from the conversation about why this commitment matters" 
          }
        },
        required: ["commitment_text"],
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
        .select('full_name, display_name, neighborhood, neighborhood_description, dreams, tech_familiarity, ai_coding_experience')
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

AUTHENTICATED USER - This user IS signed in. You CAN save commitments and contributions to their profile.

BUILDER CONTEXT (personalize your responses to this person):
- Full name: ${profile.full_name || 'Not provided'}
- Preferred name: ${profile.display_name || 'Builder'}
- Neighborhood: ${profile.neighborhood || 'Not specified'}${profile.neighborhood_description ? ` - ${profile.neighborhood_description}` : ''}
- Their dream: ${profile.dreams || 'Exploring possibilities'}
- Tech comfort: ${techComfortLabel}
- AI experience: ${aiExperienceLabel}

CRITICAL: This user is ${namesList}. When recommending people to connect with or stories/contributions to explore, DO NOT recommend they contact themselves or their own contributions. If you find library items attributed to them, acknowledge they created it rather than suggesting they "reach out to" themselves.

Use their preferred name naturally in conversation. Reference their neighborhood when relevant. Adjust technical explanations based on their comfort level. Connect suggestions to their stated dreams when possible.

When they confirm a commitment, immediately use the record_commitment tool - they are authenticated and it will work.
`;
        console.log('Profile context loaded for verified user:', userId, 'Names:', namesList);
      } else {
        // User is authenticated but profile fetch failed or no profile yet
        profileContext = `

AUTHENTICATED USER - This user IS signed in. You CAN save commitments and contributions to their profile.
`;
        console.log('User authenticated but no profile data:', userId);
      }
    } else if (demoMode) {
      // Demo mode - visitor trying out Sidekick before signing up
      profileContext = `

DEMO MODE - This visitor is trying out Sidekick before signing up.
You can help them explore the library and understand relational tech.
Do NOT offer to save commitments or add contributions - they need to create an account first.
Keep responses helpful and inviting. After a few exchanges, you can naturally mention that signing up unlocks the full Studio experience with features like saving commitments and contributing to the library.
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

    // Extract meaningful keywords from the user message
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

    console.log('Extracted keywords:', keywords);

    // Search for relevant content from all library sources
    let relevantPrompts: any[] = [];
    let relevantStories: any[] = [];
    let relevantTools: any[] = [];
    
    if (keywords.length > 0) {
      const promptSearchConditions = keywords.map((keyword: string) => {
        const sanitized = keyword.replace(/[%_]/g, '');
        return `title.ilike.%${sanitized}%,category.ilike.%${sanitized}%,description.ilike.%${sanitized}%`;
      }).join(',');

      const storySearchConditions = keywords.map((keyword: string) => {
        const sanitized = keyword.replace(/[%_]/g, '');
        return `title.ilike.%${sanitized}%,story_text.ilike.%${sanitized}%,attribution.ilike.%${sanitized}%`;
      }).join(',');

      const toolSearchConditions = keywords.map((keyword: string) => {
        const sanitized = keyword.replace(/[%_]/g, '');
        return `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`;
      }).join(',');

      const [promptsResult, storiesResult, toolsResult] = await Promise.all([
        supabase.from('prompts').select('title, category, description, example_prompt').or(promptSearchConditions).limit(10),
        supabase.from('stories').select('title, story_text, attribution, full_story_text').or(storySearchConditions).limit(10),
        supabase.from('tools').select('name, description, url').or(toolSearchConditions).limit(10)
      ]);

      if (promptsResult.data) {
        relevantPrompts = promptsResult.data.map((prompt: any) => {
          let score = 0;
          const titleLower = prompt.title.toLowerCase();
          const categoryLower = prompt.category.toLowerCase();
          const descLower = (prompt.description || '').toLowerCase();
          
          keywords.forEach((keyword: string) => {
            if (titleLower.includes(keyword)) score += 10;
            if (categoryLower.includes(keyword)) score += 5;
            if (descLower.includes(keyword)) score += 2;
          });
          
          return { ...prompt, score };
        }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);
      }

      if (storiesResult.data) {
        relevantStories = storiesResult.data.map((story: any) => {
          let score = 0;
          const titleLower = (story.title || '').toLowerCase();
          const textLower = story.story_text.toLowerCase();
          
          keywords.forEach((keyword: string) => {
            if (titleLower.includes(keyword)) score += 10;
            if (textLower.includes(keyword)) score += 3;
          });
          
          return { ...story, score };
        }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);
      }

      if (toolsResult.data) {
        relevantTools = toolsResult.data.map((tool: any) => {
          let score = 0;
          const nameLower = tool.name.toLowerCase();
          const descLower = tool.description.toLowerCase();
          
          keywords.forEach((keyword: string) => {
            if (nameLower.includes(keyword)) score += 10;
            if (descLower.includes(keyword)) score += 5;
          });
          
          return { ...tool, score };
        }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);
      }

      console.log('Found content:', {
        prompts: relevantPrompts.map(p => ({ title: p.title, score: p.score })),
        stories: relevantStories.map(s => ({ title: s.title, score: s.score })),
        tools: relevantTools.map(t => ({ name: t.name, score: t.score }))
      });
    }

    // Fetch IDs for the relevant items
    const promptIds = relevantPrompts.length > 0 
      ? (await supabase.from('prompts').select('id, title').in('title', relevantPrompts.map(p => p.title))).data || []
      : [];
    
    const storyIds = relevantStories.length > 0
      ? (await supabase.from('stories').select('id, title').in('title', relevantStories.map(s => s.title || 'Untitled').filter(t => t !== 'Untitled'))).data || []
      : [];
    
    const toolIds = relevantTools.length > 0
      ? (await supabase.from('tools').select('id, name').in('name', relevantTools.map(t => t.name))).data || []
      : [];

    // Build library context
    let libraryContext = '';
    
    if (relevantPrompts.length > 0) {
      libraryContext += `\n\nRELEVANT PROMPTS FROM THE LIBRARY:\n${relevantPrompts.map(p => {
        const promptId = promptIds.find(pi => pi.title === p.title)?.id || 'unknown';
        return `\n---\nID: ${promptId}\nTitle: ${p.title}\nCategory: ${p.category}\nDescription: ${p.description || 'N/A'}\nExample Prompt:\n${p.example_prompt}\n---`;
      }).join('\n')}`;
    }

    if (relevantStories.length > 0) {
      libraryContext += `\n\nRELEVANT STORIES FROM THE LIBRARY:\n${relevantStories.map(s => {
        const storyId = storyIds.find(si => si.title === (s.title || 'Untitled'))?.id || 'unknown';
        return `\n---\nID: ${storyId}\nTitle: ${s.title || 'Untitled'}\nAttribution: ${s.attribution || 'Anonymous'}\nStory:\n${s.full_story_text || s.story_text}\n---`;
      }).join('\n')}`;
    }

    if (relevantTools.length > 0) {
      libraryContext += `\n\nRELEVANT TOOLS FROM THE LIBRARY:\n${relevantTools.map(t => {
        const toolId = toolIds.find(ti => ti.name === t.name)?.id || 'unknown';
        return `\n---\nID: ${toolId}\nName: ${t.name}\nDescription: ${t.description}\nURL: ${t.url}\n---`;
      }).join('\n')}`;
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

YOUR CAPABILITIES:
1. EXPLORE THE LIBRARY: Help users browse and understand stories, prompts, and tools
   - Answer questions about specific stories or tools
   - Make connections between different library items
   - Share relevant examples when asked

2. REMIX PROMPTS: Guide users through creating customized prompts for their neighborhoods
   - Ask about their neighborhood's context (location, community characteristics, unique needs)
   - Ask what they'd like to add, change, or customize about the tool
   - Gather enough detail about their vision and constraints
   - Deliver a clear, complete prompt that can be copy-pasted directly into Lovable or Dyad
   - Suggest combinations with other relational tech tools if relevant (but don't be pushy)

3. RECEIVE CONTRIBUTIONS (Commons Librarian Role):
   This is a special gift. When someone wants to share a story, prompt, or tool recommendation, you become a gentle librarian who helps them craft and contribute their gift to the commons.
   
   RECOGNIZING CONTRIBUTION INTENT - Look for phrases like:
   - "We did something cool in our neighborhood..."
   - "I made a tool that..."
   - "Here's something that worked for us..."
   - "I want to share a story about..."
   - "Can I add a prompt about..."
   - "I found a great tool for..."
   - Or any time someone shares an experience, idea, or resource that could help others
   
   THE CONTRIBUTION FLOW:
   a) LISTEN & APPRECIATE: Thank them for wanting to share. Ask clarifying questions to understand:
      - Who is sharing this? (Name and neighborhood/place)
      - What's the context? What made this work?
      - What would help someone else try this?
   
   b) LIGHTLY EDIT & FORMAT: Shape their words into a clear, inviting contribution while keeping their voice. Don't over-polish - authenticity matters more than perfection.
   
   c) PRESENT FOR CONSENT: Show them exactly how their gift would appear in the library. Be specific:
      "Here's how your story would appear in the commons:
      
      Title: [Your title]
      From: [Attribution]
      
      [The formatted content]
      
      Would you like me to add this to the shared library? Others will be able to read it and be inspired by what worked in your neighborhood."
   
   d) WAIT FOR EXPLICIT CONSENT: Only after they say yes, confirm, agree, or give clear permission should you call the submission function. Never submit without consent.
   
   e) CELEBRATE: After submission, thank them warmly. Their gift will help others.

YOUR STYLE:
- Be warm, conversational, and genuinely curious about their neighborhood
- Keep responses focused and helpful - no fluff
- Ask clarifying questions when needed
- When delivering a final prompt, make it clear, actionable, and ready to use
- Celebrate the small-scale, hyperlocal nature of what they're building
- Remember: these are village-scale tools built by and for neighbors
- When receiving contributions, honor their voice and context

IMPORTANT: When referencing specific library items from the context above, use this format in your response:
[LIBRARY_ITEM:type:id:title]

For example:
- [LIBRARY_ITEM:story:123e4567-e89b-12d3-a456-426614174000:Community Garden Story]
- [LIBRARY_ITEM:prompt:987fcdeb-51a2-43f7-b789-123456789abc:Block Party Prompt]
- [LIBRARY_ITEM:tool:456def78-90ab-12cd-ef34-567890abcdef:Neighborhood Directory]

Include 2-3 relevant library item markers naturally in your responses when you're discussing items from the context. This allows users to see preview cards and easily navigate to the full items in the library.

IMPORTANT FOR PROMPT REMIXING:
- Don't rush to deliver the prompt - gather context first
- The final prompt you deliver should be a complete prompt ready for an AI builder
- Always acknowledge the specific context they share about their neighborhood
- Gently remind them that the tool will likely change and that's okay

IMPORTANT FOR CONTRIBUTIONS:
- Each contribution should read as an invitation from a real person in a real place
- Attribution matters: always include who is sharing and where they're from
- Context matters: what made this work? what's unique about their situation?
- Keep their voice: light editing, not rewriting
- NEVER call submission functions without explicit user consent
- If they seem hesitant, reassure them that their contribution can inspire others even if it's imperfect

COMMITMENT TRACKING:
When you notice the user making a commitment during conversation (e.g., "I'm going to try this at our next meeting", "I'll reach out to my neighbor about this", "I want to organize a gathering"), gently acknowledge it and ask:
"That sounds like a commitment! Would you like me to track this for you? I can add it to your profile so you can revisit it later."
Only call the record_commitment tool AFTER they confirm they want to track it.

Begin by understanding what they're looking for - whether that's exploring the library, remixing a prompt, or contributing something new.${profileContext}${libraryContext}`;

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
      
      let insertResult: any = null;
      let contributionType = 'item';
      let contributionTitle = 'Untitled';
      
      // Execute the appropriate database insert
      if (functionName === 'submit_story') {
        contributionType = 'story';
        contributionTitle = args.title;
        insertResult = await supabase.from('stories').insert({
          title: args.title,
          story_text: args.story_text,
          full_story_text: args.full_story_text,
          attribution: args.attribution
        }).select('id').single();
      } else if (functionName === 'submit_prompt') {
        contributionType = 'prompt';
        contributionTitle = args.title;
        insertResult = await supabase.from('prompts').insert({
          title: args.title,
          category: args.category,
          description: args.description,
          example_prompt: args.example_prompt
        }).select('id').single();
      } else if (functionName === 'submit_tool') {
        contributionType = 'tool';
        contributionTitle = args.name;
        insertResult = await supabase.from('tools').insert({
          name: args.name,
          description: args.description,
          url: args.url
        }).select('id').single();
      } else if (functionName === 'record_commitment') {
        // Handle commitment recording
        if (!userId) {
          return new Response(
            JSON.stringify({ 
              response: "I'd love to track this commitment for you, but you'll need to be signed in first. Once you're logged in, I can save commitments to your profile.",
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const commitmentResult = await supabase.from('commitments').insert({
          user_id: userId,
          commitment_text: args.commitment_text,
          source_chat_context: args.context || null,
          status: 'active'
        }).select('id').single();
        
        if (commitmentResult.error) {
          console.error('Commitment insert error:', commitmentResult.error);
          return new Response(
            JSON.stringify({ 
              response: "I tried to save your commitment, but ran into a technical issue. Would you like to try again?",
              error: commitmentResult.error.message 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Award serviceberries for making a commitment (use user's auth context for RPC)
        if (userSupabase) {
          const { error: serviceberryError } = await userSupabase.rpc('award_serviceberries', {
            p_user_id: userId,
            p_amount: 5,
            p_reason: 'commitment_made',
            p_reference_id: commitmentResult.data.id
          });
          
          if (serviceberryError) {
            console.error('Serviceberries award error:', serviceberryError);
            // Don't fail the whole operation, just log the error
          } else {
            console.log('Serviceberries awarded for commitment:', commitmentResult.data.id);
          }
        }
        
        console.log('Commitment saved:', commitmentResult.data.id);
        
        return new Response(
          JSON.stringify({ 
            response: `I've added "${args.commitment_text}" to your commitments! You can view and track all your commitments on your Profile page. I'll be here when you're ready to share how it went.`,
            commitment: {
              id: commitmentResult.data.id,
              text: args.commitment_text
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (insertResult?.error) {
        console.error('Database insert error:', insertResult.error);
        return new Response(
          JSON.stringify({ 
            response: `I tried to add your ${contributionType} to the library, but ran into a technical issue. Would you like to try again?`,
            error: insertResult.error.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const newId = insertResult?.data?.id;
      console.log('Contribution saved:', contributionType, newId);
      
      // Return success response with contribution info
      return new Response(
        JSON.stringify({ 
          response: `Your ${contributionType} has been added to the commons! Thank you for this gift. "${contributionTitle}" is now part of our shared library, ready to inspire neighbors in other places. You can find it in the Library whenever you'd like to revisit it.`,
          contribution: {
            type: contributionType,
            id: newId,
            title: contributionTitle
          }
        }),
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