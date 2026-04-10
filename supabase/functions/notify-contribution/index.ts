import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const body = await req.json();
    const { contributor_name, contributor_email, contribution_type, description, subject } = body;

    if (!contributor_name?.trim() || !contributor_email?.trim() || !description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Name, email, and description are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const typeLabel = contribution_type === "story" ? "Story" :
                      contribution_type === "tool" ? "Tool" : "Other";

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["humans@relationaltechproject.org"],
      subject: subject || `New Contribution from ${contributor_name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px;">
          <h2 style="color: #3d3129; margin-bottom: 16px;">New ${typeLabel} Contribution</h2>
          <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${contributor_name}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${contributor_email}</p>
            <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${typeLabel}</p>
            <p style="margin: 0 0 8px 0;"><strong>Details:</strong></p>
            <p style="margin: 0; color: #3d3129; line-height: 1.6; white-space: pre-wrap;">${description}</p>
            <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;">
              <strong>Submitted:</strong> ${timestamp} ET
            </p>
          </div>
          <p style="color: #7a6d61; font-size: 14px;">
            — Relational Tech Studio
          </p>
        </div>
      `,
    });

    console.log("Contribution notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-contribution:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
