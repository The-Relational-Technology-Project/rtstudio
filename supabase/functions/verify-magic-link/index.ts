import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

interface VerifyRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', 'verify-magic-link')
      .eq('identifier', clientIp)
      .gte('attempted_at', windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin.from('rate_limit_attempts').insert({
      endpoint: 'verify-magic-link',
      identifier: clientIp,
    });

    const { token }: VerifyRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up the token
    const { data: tokenRecord, error: lookupError } = await supabaseAdmin
      .from("magic_link_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (lookupError || !tokenRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = tokenRecord.email;

    // Mark token as used
    await supabaseAdmin
      .from("magic_link_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          email: email,
          userId: existingUser.id,
          requiresOtpVerification: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error("Failed to create user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = newUser.user.id;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          email: email,
          userId: userId,
          isNewUser: true,
          requiresOtpVerification: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Error in verify-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
