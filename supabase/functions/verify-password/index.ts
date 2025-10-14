import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    // Input validation
    if (!password || typeof password !== 'string' || password.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid password format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query the credentials table
    const { data, error } = await supabase
      .from('access_credentials')
      .select('password_hash')
      .limit(1)
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password (simple comparison for now - in production use bcrypt)
    const isValid = data?.password_hash === password;

    if (!isValid) {
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed JWT token for session management
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'default-secret-change-in-production';
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
