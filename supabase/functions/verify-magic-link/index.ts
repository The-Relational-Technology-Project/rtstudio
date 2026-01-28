import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the token
    const { data: tokenRecord, error: lookupError } = await supabaseAdmin
      .from("magic_link_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (lookupError || !tokenRecord) {
      console.error("Token lookup failed:", lookupError);
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
    let accessToken: string;
    let refreshToken: string;

    if (existingUser) {
      // User exists - generate a session for them
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

      if (sessionError) {
        console.error("Failed to generate session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Use signInWithOtp to complete the sign-in and get actual tokens
      // The generateLink approach gives us a link, but we need tokens
      // So we'll create a new approach: use admin to create a session directly

      // Alternative: Use the OTP verification endpoint
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
      });

      // Actually, let's use a different approach - generate magic link and extract token
      // The cleanest way is to sign in with a generated OTP
      
      userId = existingUser.id;
      
      // Generate a direct session using admin
      // This creates a valid session for the user
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      // Return the magic link properties that the client can use
      // The client will need to complete the OTP verification
      return new Response(
        JSON.stringify({ 
          success: true, 
          email: email,
          userId: existingUser.id,
          // We'll use a workaround: have the client do signInWithOtp
          requiresOtpVerification: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      // Create new user with auto-confirm
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
