import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

async function checkRateLimit(supabase: any, endpoint: string, identifier: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('rate_limit_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
    .eq('identifier', identifier)
    .gte('attempted_at', windowStart);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

async function recordAttempt(supabase: any, endpoint: string, identifier: string) {
  await supabase.from('rate_limit_attempts').insert({ endpoint, identifier });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const isLimited = await checkRateLimit(supabase, 'verify-password', clientIp);
    if (isLimited) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { password } = await req.json();

    // Input validation
    if (!password || typeof password !== 'string' || password.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid password format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record attempt before checking password
    await recordAttempt(supabase, 'verify-password', clientIp);

    // Read password from secrets (prefer hash if available)
    const passwordHash = Deno.env.get('STUDIO_PASSWORD_HASH');
    const passwordPlain = Deno.env.get('STUDIO_PASSWORD');

    if (!passwordHash && !passwordPlain) {
      console.error('Auth not configured: missing STUDIO_PASSWORD or STUDIO_PASSWORD_HASH');
      return new Response(
        JSON.stringify({ error: 'Authentication service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isValid = false;
    if (passwordHash) {
      isValid = await bcrypt.compare(password, passwordHash);
    } else if (passwordPlain) {
      isValid = password === passwordPlain;
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed JWT token for session management
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Authentication service misconfigured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const encoder = new TextEncoder();
    const keyBuf = encoder.encode(jwtSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuf,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const payload = {
      iss: 'studio-auth',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    return new Response(
      JSON.stringify({ valid: true, token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-password function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
