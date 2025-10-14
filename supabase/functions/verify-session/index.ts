import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

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
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token
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

    try {
      const payload = await verify(token, key);
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Token expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in verify-session function:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
