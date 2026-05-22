import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConnectionRequestBody {
  item_type: "story" | "prompt" | "tool";
  item_id: string;
  item_title: string;
  message: string;
  conversation_snippet?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: ConnectionRequestBody = await req.json();
    if (!body.item_type || !body.item_id || !body.item_title?.trim()) {
      return new Response(
        JSON.stringify({ error: "item_type, item_id, item_title required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (!["story", "prompt", "tool"].includes(body.item_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid item_type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the item has organizer consent — server-side guard
    const table = body.item_type === "story" ? "stories" : body.item_type === "prompt" ? "prompts" : "tools";
    const { data: itemRow } = await supabaseAdmin
      .from(table)
      .select("organizer_consent_to_contact")
      .eq("id", body.item_id)
      .maybeSingle();
    if (!itemRow?.organizer_consent_to_contact) {
      return new Response(
        JSON.stringify({ error: "Item is not opted in for organizer intros" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limit: 5 per day per user
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("rate_limit_attempts")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "notify-connection-request")
      .eq("identifier", user.id)
      .gte("attempted_at", windowStart);
    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many connection requests today. Please try again tomorrow." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    await supabaseAdmin.from("rate_limit_attempts").insert({
      endpoint: "notify-connection-request",
      identifier: user.id,
    });

    // Load requester profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, full_name, email, neighborhood")
      .eq("id", user.id)
      .maybeSingle();

    const requesterName = profile?.display_name || profile?.full_name || user.email || "Unknown builder";
    const requesterEmail = profile?.email || user.email || "";
    const neighborhood = profile?.neighborhood || "";

    // Insert connection request row
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("connection_requests")
      .insert({
        requester_user_id: user.id,
        item_type: body.item_type,
        item_id: body.item_id,
        item_title: body.item_title.slice(0, 300),
        message: (body.message || "").slice(0, 2000),
        conversation_snippet: (body.conversation_snippet || "").slice(0, 4000) || null,
      })
      .select()
      .single();
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save connection request");
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short",
    });
    const itemLink = `https://studio.relationaltechproject.org/library?item=${body.item_id}`;

    try {
      await resend.emails.send({
        from: "Relational Tech Studio <notifications@relationaltechproject.org>",
        to: ["josh@relationaltechproject.org"],
        subject: `🤝 Intro request: ${body.item_title}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 540px; padding: 20px;">
            <h2 style="color: #3d3129; margin-bottom: 16px;">Warm-intro request</h2>
            <p style="color: #7a6d61; line-height: 1.6;">
              A builder asked Sidekick to be introduced to the organizer of a library entry.
              You'll need to make the actual intro.
            </p>
            <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Builder:</strong> ${escapeHtml(requesterName)}</p>
              ${requesterEmail ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(requesterEmail)}</p>` : ""}
              ${neighborhood ? `<p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${escapeHtml(neighborhood)}</p>` : ""}
              <p style="margin: 12px 0 8px 0;"><strong>Interested in:</strong>
                <a href="${itemLink}" style="color: #c4654a;">${escapeHtml(body.item_title)}</a>
                (${body.item_type})
              </p>
              ${body.message ? `<p style="margin: 12px 0 4px 0;"><strong>Builder's note:</strong></p><p style="margin: 0; color: #3d3129; line-height: 1.6;">${escapeHtml(body.message)}</p>` : ""}
              ${body.conversation_snippet ? `<p style="margin: 12px 0 4px 0;"><strong>Conversation snippet:</strong></p><p style="margin: 0; color: #7a6d61; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(body.conversation_snippet)}</p>` : ""}
              <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;">
                <strong>Submitted:</strong> ${timestamp} ET
              </p>
            </div>
            <p style="color: #7a6d61; font-size: 14px;">
              Manage in the admin → Connection Requests tab.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email send error (non-fatal):", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, id: inserted?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-connection-request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
