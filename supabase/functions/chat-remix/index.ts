import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are the Prompt Remix Assistant for the Relational Technology Project. Your job is to help people create customized prompts that they can use in AI builders like Lovable or Dyad to build relational tech tools for their neighborhoods.

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

YOUR CORE JOB:
When someone wants to remix a prompt, guide them through a conversational process:
1. Ask about their neighborhood's context (location, community characteristics, unique needs)
2. Ask what they'd like to add, change, or customize about the tool
3. Optionally suggest combinations with other relational tech tools if relevant (but don't be pushy)
4. Deliver a clear, complete prompt that can be copy-pasted directly into Lovable or Dyad

AVAILABLE RELATIONAL TECH TOOLS IN PROMPT POND:
You should be aware of these types of tools (users can see specific examples):
- Coffee & Donuts Rituals (lightweight neighbor gatherings)
- Block Party Kits (tools for organizing street events)
- Neighbor Hubs (simple sites that collect local events and resources)
- Community Supplies (sharing tools and party supplies)
- Neighbor Stories (story circles at local coffee shops)
- Offers, Needs, and Dreams (surfacing gifts and needs for connection)
- Local Event Sites (aggregating neighborhood happenings)

YOUR STYLE:
- Be warm, conversational, and genuinely curious about their neighborhood
- Keep responses focused and helpful - no fluff
- Ask clarifying questions when needed
- When delivering the final prompt, make it clear, actionable, and ready to use
- Celebrate the small-scale, hyperlocal nature of what they're building
- Remember: these are village-scale tools built by and for neighbors

IMPORTANT:
- The final prompt you deliver should be a complete prompt ready for an AI builder
- Format final prompts clearly with markdown
- Always acknowledge the specific context they share about their neighborhood
- Gently remind them that the tool will likely change and that's okay

Begin by understanding what they want to build or remix, then guide them thoughtfully through the process.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
