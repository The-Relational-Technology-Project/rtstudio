import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 3; // Stricter for email sending

interface MagicLinkRequest {
  email: string;
  redirectUrl: string;
}

// Generate a cryptographically secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

    const { email, redirectUrl }: MagicLinkRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limit by email (prevent spam to a single address)
    const normalizedEmail = email.toLowerCase().trim();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', 'send-magic-link')
      .eq('identifier', normalizedEmail)
      .gte('attempted_at', windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record attempt
    await supabaseAdmin.from('rate_limit_attempts').insert({
      endpoint: 'send-magic-link',
      identifier: normalizedEmail,
    });

    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Failed to check user:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to prepare login link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const existingUser = existingUsers?.users?.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

      if (createError) {
        console.error("Failed to create user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: redirectUrl,
      },
    });

    const magicLinkUrl = linkData?.properties?.action_link;

    if (linkError || !magicLinkUrl) {
      console.error("Failed to generate magic link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to create magic link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: [email],
      subject: "Your magic link to sign in",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4a332a; font-size: 24px; margin-bottom: 10px;">Relational Tech Studio</h1>
          </div>
          
          <div style="background: #f7f1e9; border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #4a332a; font-size: 20px; margin-bottom: 15px;">Log in to your Studio account</h2>
            <p style="color: #7a6258; margin-bottom: 25px;">Click the button below to log in to your Studio account. This link will expire shortly.</p>
            
            <a href="${magicLinkUrl}" style="display: inline-block; background: #c75f3d; color: #fbf8f3; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Enter the Studio
            </a>
            
            <p style="color: #999; font-size: 12px; margin-top: 25px;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>Relational Tech Project</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Magic link email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Magic link sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-magic-link:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send magic link" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
