import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  noteId: string;
  title?: string;
  builderName?: string;
  builderEmail?: string | null;
  pdfBase64?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body: Body = await req.json();
    if (!body.noteId) {
      return new Response(JSON.stringify({ error: "noteId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify caller owns this note
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: note, error: noteErr } = await admin
      .from("field_notes")
      .select("id, user_id, title, is_public")
      .eq("id", body.noteId)
      .maybeSingle();
    if (noteErr || !note || note.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limit: 5/hour/user
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("rate_limit_attempts")
      .select("*", { count: "exact", head: true })
      .eq("endpoint", "notify-field-note")
      .eq("identifier", userId)
      .gte("attempted_at", windowStart);
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    await admin.from("rate_limit_attempts").insert({
      endpoint: "notify-field-note",
      identifier: userId,
    });

    const safeTitle = (body.title || note.title || "Untitled").toString().slice(0, 200);
    const builderName = (body.builderName || "A builder").toString().slice(0, 200);
    const builderEmail = body.builderEmail || "(no email on profile)";

    const attachments = body.pdfBase64
      ? [
          {
            filename: `field-note-${safeTitle.replace(/[^a-z0-9-_]+/gi, "_")}.pdf`,
            content: body.pdfBase64,
          },
        ]
      : undefined;

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["deborah@relationaltechproject.org"],
      subject: "New Field Note shared on Studio",
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; padding: 20px;">
          <h2 style="color: #3d3129;">A new Field Note was shared</h2>
          <p style="color: #7a6d61; line-height: 1.6;">
            <strong>Builder:</strong> ${builderName}<br/>
            <strong>Email:</strong> ${builderEmail}<br/>
            <strong>Title:</strong> ${safeTitle}
          </p>
          ${
            body.pdfBase64
              ? `<p style="color: #7a6d61;">The Field Note canvas is attached as a PDF.</p>`
              : `<p style="color: #7a6d61;">(PDF export was not available for this note.)</p>`
          }
        </div>
      `,
      attachments,
    });

    console.log("Field note notification sent:", emailResponse);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-field-note:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
