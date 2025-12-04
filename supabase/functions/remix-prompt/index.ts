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
    const { examplePrompt, communityContext, customizationIdeas } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Remixing prompt with community context and customization ideas");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that remixes prompts. Take the example prompt, the user\'s community context, and their customization ideas, then create a customized version that incorporates their specific needs while maintaining the quality of the original. Return ONLY the remixed prompt in plain text format - no markdown formatting, no bold (**), no italics (*), no headers (####), just clean flowing text that can be copied and used directly.' 
          },
          { 
            role: 'user', 
            content: `Example prompt:\n${examplePrompt}\n\nCommunity and place context:\n${communityContext}\n\nCustomization ideas:\n${customizationIdeas}\n\nPlease create a customized version of this prompt that incorporates the community context and customization ideas. Return only plain text without any markdown formatting.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    console.log("Successfully remixed prompt");
    
    const data = await response.json();
    const remixedPrompt = data.choices[0].message.content;

    return new Response(JSON.stringify({ remixedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in remix-prompt function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
