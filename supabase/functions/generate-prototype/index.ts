import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model config — switch to claude-sonnet-4-20250514 when volume grows
const CLAUDE_MODEL = 'claude-opus-4-20250514';
const MAX_TOKENS = 4096;
const DAILY_LIMIT = 10;

const SYSTEM_PROMPT = `You are a frontend prototype builder for neighborhood community tools. You build for the Relational Tech Studio, an open commons where people in neighborhoods across the country are building small, local, open-source tools with their neighbors.

Generate a SINGLE self-contained HTML document that creates a realistic, interactive clickthrough prototype. The output must be a complete, working demo that a builder can show to their neighbors and say "here's what I'm thinking, what do you think?"

Requirements:
- Complete HTML document starting with <!DOCTYPE html>
- All CSS in a <style> tag in <head>. All JS in a <script> tag before </body>
- No external dependencies. Everything self-contained. No CDN links.
- Mobile-friendly. Should look great on a phone since builders will share it with neighbors.
- Warm, approachable, human visual style. Avoid corporate/startup aesthetics. Think community bulletin board, local cafe, neighborhood library.
- Use realistic sample data with real-sounding neighbor names and local details. Make it feel like a real neighborhood, not a demo.
- Working UI interactions: buttons, filters, modals, tabs, toggles should all do something visible. Clicking around should feel like using a real app.
- Include 6-10 sample data items so the prototype feels populated and alive.
- Use a cohesive color palette. Warm neutrals with one or two accent colors.
- Good typography. Readable, friendly, not generic.

The prototype should help a builder imagine what their tool could become, and help their neighbors react to something concrete rather than an abstract idea. This is a conversation starter, not a final product.

Return ONLY the raw HTML document. No markdown fences. No explanation. No preamble. Start with <!DOCTYPE html>.`;

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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Use getClaims for fast validation, fall back to getUser
    let builderId: string;
    try {
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        // Fallback to getUser
        const { data: { user }, error: authError } = await userSupabase.auth.getUser();
        if (authError || !user?.id) {
          console.error('Auth validation failed:', authError?.message);
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

    const builderId = user.id;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request
    const { prompt, toolName, refinementOf, currentCode } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Please provide a more detailed prompt (at least 10 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('prototypes')
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
          error: `You've used your ${DAILY_LIMIT} builds for today. Come back tomorrow, or take this prompt to Claude Code or Lovable to keep going.`,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the user prompt
    let userPrompt = prompt;
    if (refinementOf && currentCode) {
      userPrompt = `Here is the current prototype code:\n\n${currentCode}\n\nPlease refine it with these changes:\n${prompt}\n\nReturn the complete updated HTML document.`;
    }

    console.log(`Generating prototype for builder ${builderId} (${todayCount + 1}/${DAILY_LIMIT} today). Model: ${CLAUDE_MODEL}`);

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    let generatedCode = anthropicData.content?.[0]?.text || '';
    const tokensUsed = (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0);

    // Clean up markdown fences if present
    if (generatedCode.startsWith('```html')) {
      generatedCode = generatedCode.slice(7);
    } else if (generatedCode.startsWith('```')) {
      generatedCode = generatedCode.slice(3);
    }
    if (generatedCode.endsWith('```')) {
      generatedCode = generatedCode.slice(0, -3);
    }
    generatedCode = generatedCode.trim();

    if (!generatedCode.startsWith('<!DOCTYPE') && !generatedCode.startsWith('<html')) {
      throw new Error('Generated code does not appear to be valid HTML');
    }

    // Generate a share ID
    const shareId = crypto.randomUUID().split('-')[0]; // short 8-char ID

    // Store prototype
    const { data: prototype, error: insertError } = await supabase
      .from('prototypes')
      .insert({
        builder_id: builderId,
        prompt,
        generated_code: generatedCode,
        model: CLAUDE_MODEL,
        tokens_used: tokensUsed,
        share_id: shareId,
        tool_name: toolName || null,
        refinement_of: refinementOf || null,
      })
      .select('id, share_id')
      .single();

    if (insertError) {
      console.error('Prototype insert error:', insertError);
      throw new Error('Failed to save prototype');
    }

    // Increment global counter
    await supabase.rpc('increment_prototype_counter').catch((err: any) => {
      console.error('Counter increment error (non-fatal):', err);
    });

    console.log(`Prototype generated: ${prototype.id}, tokens: ${tokensUsed}`);

    return new Response(
      JSON.stringify({
        code: generatedCode,
        model: CLAUDE_MODEL,
        usage: anthropicData.usage,
        prototypeId: prototype.id,
        shareId: prototype.share_id,
        remaining: DAILY_LIMIT - todayCount - 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('generate-prototype error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
