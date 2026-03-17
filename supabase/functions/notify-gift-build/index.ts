import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GiftBuildRequest {
  builder_name: string;
  builder_email?: string;
  neighborhood?: string;
  idea_title: string;
  idea_summary: string;
  conversation_context?: string;
  source: "sidekick" | "support_page";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for authenticated user (optional - support page form works without auth)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
      }
    }

    const body: GiftBuildRequest = await req.json();

    // Validate required fields
    if (!body.idea_title?.trim() || !body.builder_name?.trim() || !body.idea_summary?.trim()) {
      return new Response(
        JSON.stringify({ error: "Name, idea title, and idea summary are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.idea_title.length > 200 || body.idea_summary.length > 5000 || body.builder_name.length > 200) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limit: 3 per hour per identifier
    const identifier = userId || body.builder_email || "anonymous";
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("rate_limit_attempts")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "notify-gift-build")
      .eq("identifier", identifier)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin.from("rate_limit_attempts").insert({
      endpoint: "notify-gift-build",
      identifier,
    });

    // Insert into gift_build_requests
    const { error: insertError } = await supabaseAdmin.from("gift_build_requests").insert({
      builder_name: body.builder_name.trim(),
      builder_email: body.builder_email?.trim() || null,
      neighborhood: body.neighborhood?.trim() || null,
      idea_title: body.idea_title.trim(),
      idea_summary: body.idea_summary.trim(),
      conversation_context: body.conversation_context?.trim() || null,
      source: body.source || "support_page",
      user_id: userId,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save gift build request");
    }

    // Send email notification
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const sourceLabel = body.source === "sidekick" ? "Sidekick chat" : "Support page form";

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["josh@relationaltechproject.org"],
      subject: `🎁 Gift Build Request: ${body.idea_title.trim()}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; padding: 20px;">
          <h2 style="color: #3d3129; margin-bottom: 16px;">Gift Build Request</h2>
          <p style="color: #7a6d61; line-height: 1.6;">
            A builder wants hands-on help bringing an idea to life!
          </p>
          <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Builder:</strong> ${body.builder_name}</p>
            ${body.builder_email ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${body.builder_email}</p>` : ""}
            ${body.neighborhood ? `<p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${body.neighborhood}</p>` : ""}
            <p style="margin: 0 0 8px 0;"><strong>Idea:</strong> ${body.idea_title}</p>
            <p style="margin: 0 0 8px 0;"><strong>Description:</strong></p>
            <p style="margin: 0 0 8px 0; color: #3d3129; line-height: 1.6;">${body.idea_summary}</p>
            ${body.conversation_context ? `<p style="margin: 12px 0 8px 0;"><strong>Conversation context:</strong></p><p style="margin: 0; color: #7a6d61; font-size: 14px; line-height: 1.5;">${body.conversation_context}</p>` : ""}
            <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;">
              <strong>Source:</strong> ${sourceLabel} · <strong>Submitted:</strong> ${timestamp} ET
            </p>
          </div>
          <p style="color: #7a6d61; font-size: 14px;">
            — Relational Tech Studio
          </p>
        </div>
      `,
    });

    console.log("Gift build notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-gift-build:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
