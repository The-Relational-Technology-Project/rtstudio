import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
      .replace(/[^a-z0-9\s-]/g, ' ') // Remove special chars but keep hyphens
      .split(/\s+/)
      .filter((word: string) => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limit to first 5 meaningful keywords

    console.log('Extracted keywords:', keywords);

    // Search for relevant content from all library sources
    let relevantPrompts: any[] = [];
    let relevantStories: any[] = [];
    let relevantTools: any[] = [];
    
    if (keywords.length > 0) {
      // Build search conditions for each keyword
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

      // Fetch all content types in parallel
      const [promptsResult, storiesResult, toolsResult] = await Promise.all([
        supabase.from('prompts').select('title, category, description, example_prompt').or(promptSearchConditions).limit(10),
        supabase.from('stories').select('title, story_text, attribution, full_story_text').or(storySearchConditions).limit(10),
        supabase.from('tools').select('name, description, url').or(toolSearchConditions).limit(10)
      ]);

      // Process prompts
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

      // Process stories
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

      // Process tools
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

    // Fetch IDs for the relevant items to include in library item markers
    const promptIds = relevantPrompts.length > 0 
      ? (await supabase.from('prompts').select('id, title').in('title', relevantPrompts.map(p => p.title))).data || []
      : [];
    
    const storyIds = relevantStories.length > 0
      ? (await supabase.from('stories').select('id, title').in('title', relevantStories.map(s => s.title || 'Untitled').filter(t => t !== 'Untitled'))).data || []
      : [];
    
    const toolIds = relevantTools.length > 0
      ? (await supabase.from('tools').select('id, name').in('name', relevantTools.map(t => t.name))).data || []
      : [];

    // Build library context with IDs for markers
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

    const systemPrompt = `You are Sidekick, an AI assistant for the Relational Technology Studio. You help people explore stories, prompts, and tools from the library, and guide them in creating relational tech for their neighborhoods.

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

3. HELP WITH CONTRIBUTIONS: Support users in sharing their own stories, prompts, or tools
   - Ask clarifying questions to help them articulate their ideas
   - Draft contribution text for them to review and submit

YOUR STYLE:
- Be warm, conversational, and genuinely curious about their neighborhood
- Keep responses focused and helpful - no fluff
- Ask clarifying questions when needed
- When delivering a final prompt, make it clear, actionable, and ready to use
- Celebrate the small-scale, hyperlocal nature of what they're building
- Remember: these are village-scale tools built by and for neighbors

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

Begin by understanding what they're looking for - whether that's exploring the library, remixing a prompt, or contributing something new.${libraryContext}`;

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
    const assistantMessage = data.choices[0].message.content;

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
