import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: MagicLinkRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role for DB access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const { error: insertError } = await supabaseAdmin
      .from("magic_link_tokens")
      .insert({
        email: email.toLowerCase().trim(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create magic link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build magic link URL
    const magicLinkUrl = `${redirectUrl}?token=${token}`;

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
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 10px;">Relational Tech Studio</h1>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 15px;">Sign in to your account</h2>
            <p style="color: #666; margin-bottom: 25px;">Click the button below to sign in. This link will expire in 1 hour.</p>
            
            <a href="${magicLinkUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Sign In
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
