import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type StewardKind = "rtp_steward" | "adjacent_builder";

interface StewardConnectRequest {
  build_plan_id: string;
  kind: StewardKind;
  share_chat_history: boolean;
  chat_excerpt?: string;
  note?: string;
}

// Escape user-supplied text before embedding in HTML
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const KIND_LABELS: Record<StewardKind, string> = {
  rtp_steward: "An RTP steward (Josh)",
  adjacent_builder: "Someone in the network building something adjacent",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth required — plan ownership matters
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");

    let userId: string;
    let userEmail: string | null = null;
    try {
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user?.id) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication." }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        userId = user.id;
        userEmail = user.email || null;
      } else {
        userId = claimsData.claims.sub as string;
        userEmail = (claimsData.claims.email as string) || null;
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Authentication failed." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: StewardConnectRequest = await req.json().catch(() => ({} as StewardConnectRequest));

    if (!body.build_plan_id || typeof body.build_plan_id !== "string") {
      return new Response(
        JSON.stringify({ error: "build_plan_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const kind: StewardKind = body.kind === "adjacent_builder" ? "adjacent_builder" : "rtp_steward";
    const shareChatHistory = body.share_chat_history === true;
    const chatExcerpt = shareChatHistory ? (body.chat_excerpt?.trim()?.slice(0, 16000) || null) : null;
    const note = body.note?.trim()?.slice(0, 2000) || null;

    // Rate limit: 3 per hour per builder
    const identifier = userId;
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("rate_limit_attempts")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "notify-steward-connect")
      .eq("identifier", identifier)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up plan — verify ownership before sharing
    const { data: plan, error: planError } = await supabaseAdmin
      .from("build_plans")
      .select("id, builder_id, title, detailed_prompt, plan_markdown, recommended_track, created_at")
      .eq("id", body.build_plan_id)
      .maybeSingle();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Build plan not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (plan.builder_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You can only connect about plans you own." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up builder profile for name + neighborhood
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name, neighborhood")
      .eq("id", userId)
      .maybeSingle();

    const builderName = (profile?.display_name || profile?.full_name || "A builder").trim();
    const builderNeighborhood = (profile?.neighborhood || "").trim();

    // Record rate limit attempt
    await supabaseAdmin.from("rate_limit_attempts").insert({
      endpoint: "notify-steward-connect",
      identifier,
    });

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const kindLabel = KIND_LABELS[kind];
    const subject = kind === "rtp_steward"
      ? `Steward intro: ${plan.title}`
      : `Adjacent-builder match: ${plan.title}`;

    const trackLabel = plan.recommended_track === "lovable"
      ? "Lovable track"
      : plan.recommended_track === "claude_code"
        ? "Claude Code track"
        : null;

    const chatBlock = chatExcerpt
      ? `
        <p style="margin: 20px 0 8px 0;"><strong>Chat transcript (shared with permission):</strong></p>
        <pre style="background: #f3eee5; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #3d3129; white-space: pre-wrap; word-wrap: break-word; margin: 0;">${htmlEscape(chatExcerpt)}</pre>`
      : `<p style="margin: 16px 0 0 0; color: #7a6d61; font-size: 13px; font-style: italic;">
          Builder chose not to share the chat history.
        </p>`;

    const noteBlock = note
      ? `<p style="margin: 16px 0 8px 0;"><strong>Note from the builder:</strong></p>
         <p style="margin: 0; color: #3d3129; line-height: 1.6;">${htmlEscape(note)}</p>`
      : "";

    const neighborhoodLine = builderNeighborhood
      ? `<p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${htmlEscape(builderNeighborhood)}</p>`
      : "";

    const emailLine = userEmail
      ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${htmlEscape(userEmail)}</p>`
      : `<p style="margin: 0 0 8px 0; color: #7a6d61; font-size: 13px;">(Builder email not on file)</p>`;

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["josh@relationaltechproject.org"],
      subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 640px; padding: 20px;">
          <h2 style="color: #3d3129; margin-bottom: 8px;">Steward connect request</h2>
          <p style="color: #7a6d61; margin: 0 0 16px 0;">${htmlEscape(builderName)} would like to connect with: <strong>${kindLabel}</strong>.</p>

          <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Builder:</strong> ${htmlEscape(builderName)}</p>
            ${emailLine}
            ${neighborhoodLine}
            <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 13px;">Submitted: ${htmlEscape(timestamp)} ET</p>
          </div>

          <h3 style="color: #3d3129; margin: 0 0 8px 0;">${htmlEscape(plan.title)}</h3>
          ${trackLabel ? `<p style="margin: 0 0 16px 0; color: #7a6d61; font-size: 13px;">Recommended: ${trackLabel}</p>` : ""}

          <p style="margin: 16px 0 8px 0;"><strong>Detailed prompt:</strong></p>
          <pre style="background: #f3eee5; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #3d3129; white-space: pre-wrap; word-wrap: break-word; margin: 0;">${htmlEscape(plan.detailed_prompt)}</pre>

          <p style="margin: 20px 0 8px 0;"><strong>Plan:</strong></p>
          <pre style="background: #f3eee5; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #3d3129; white-space: pre-wrap; word-wrap: break-word; margin: 0;">${htmlEscape(plan.plan_markdown)}</pre>

          ${noteBlock}

          ${chatBlock}

          <p style="margin: 24px 0 0 0; color: #7a6d61; font-size: 13px;">— Relational Tech Studio</p>
        </div>
      `,
    });

    console.log(`Steward connect notification sent: plan=${plan.id} kind=${kind} share_chat=${shareChatHistory}`);

    return new Response(
      JSON.stringify({ success: true, id: (emailResponse as any)?.data?.id ?? null }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in notify-steward-connect:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
