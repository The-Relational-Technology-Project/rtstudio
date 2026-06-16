import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JamSessionSuggestion {
  name: string;
  email?: string;
  neighborhood?: string;
  topic: string;
  description: string;
  preferred_timing?: string;
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

    const body: JamSessionSuggestion = await req.json();

    if (!body.name?.trim() || !body.topic?.trim() || !body.description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Name, topic, and description are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (
      body.name.length > 200 ||
      body.topic.length > 200 ||
      body.description.length > 5000
    ) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const identifier = userId || body.email || "anonymous";
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("rate_limit_attempts")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "notify-jam-session")
      .eq("identifier", identifier)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin.from("rate_limit_attempts").insert({
      endpoint: "notify-jam-session",
      identifier,
    });

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["josh@relationaltechproject.org"],
      subject: `🎶 Jam Session Suggestion: ${body.topic.trim()}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; padding: 20px;">
          <h2 style="color: #3d3129; margin-bottom: 16px;">Jam Session Suggestion</h2>
          <p style="color: #7a6d61; line-height: 1.6;">
            A builder suggested an event or group build session.
          </p>
          <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${body.name}</p>
            ${body.email ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${body.email}</p>` : ""}
            ${body.neighborhood ? `<p style="margin: 0 0 8px 0;"><strong>Neighborhood:</strong> ${body.neighborhood}</p>` : ""}
            <p style="margin: 0 0 8px 0;"><strong>Topic:</strong> ${body.topic}</p>
            <p style="margin: 0 0 8px 0;"><strong>Description:</strong></p>
            <p style="margin: 0 0 8px 0; color: #3d3129; line-height: 1.6;">${body.description}</p>
            ${body.preferred_timing ? `<p style="margin: 12px 0 0 0;"><strong>Preferred timing:</strong> ${body.preferred_timing}</p>` : ""}
            <p style="margin: 12px 0 0 0; color: #7a6d61; font-size: 14px;">
              <strong>Submitted:</strong> ${timestamp} ET
            </p>
          </div>
        </div>
      `,
    });

    console.log("Jam session suggestion sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-jam-session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
