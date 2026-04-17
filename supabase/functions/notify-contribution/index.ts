import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

interface Payload {
  title?: string;
  description?: string;
  links?: string[];
  imagePaths?: string[];
  contributor_name?: string;
  contributor_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Server not configured");
    }

    // Validate JWT — contributions are logged-in-only
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const user = userData.user;

    const body = (await req.json()) as Payload;
    const title = body.title?.trim();
    const description = body.description?.trim();
    const links = (body.links ?? []).map((l) => l.trim()).filter(Boolean).slice(0, 5);
    const imagePaths = (body.imagePaths ?? []).slice(0, 4);
    const contributor_name = body.contributor_name?.trim();
    const contributor_email = body.contributor_email?.trim();

    if (!title || !description || !contributor_name || !contributor_email) {
      return new Response(
        JSON.stringify({ error: "Title, description, name, and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 7-day signed URLs for each uploaded image
    const signedImages: { path: string; url: string }[] = [];
    for (const path of imagePaths) {
      const { data, error } = await admin.storage
        .from("contribution-uploads")
        .createSignedUrl(path, SEVEN_DAYS_SECONDS);
      if (!error && data?.signedUrl) {
        signedImages.push({ path, url: data.signedUrl });
      } else {
        console.error("Signed URL error for", path, error);
      }
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const linksHtml = links.length
      ? `<p style="margin: 12px 0 4px 0;"><strong>Links:</strong></p><ul style="margin: 0 0 8px 20px; padding: 0;">${links
          .map(
            (l) =>
              `<li style="margin: 0 0 4px 0;"><a href="${escapeHtml(l)}" style="color: #7a4e2f;">${escapeHtml(l)}</a></li>`
          )
          .join("")}</ul>`
      : "";

    const imagesHtml = signedImages.length
      ? `<p style="margin: 12px 0 4px 0;"><strong>Images (links expire in 7 days):</strong></p>${signedImages
          .map(
            (img, i) =>
              `<div style="margin: 0 0 12px 0;">
                <img src="${img.url}" alt="Contribution image ${i + 1}" style="max-width: 400px; max-height: 300px; display: block; border-radius: 6px; margin-bottom: 4px;" />
                <a href="${img.url}" style="font-size: 13px; color: #7a4e2f;">Download original (${escapeHtml(img.path.split("/").pop() ?? "image")})</a>
              </div>`
          )
          .join("")}`
      : "";

    const resend = new Resend(RESEND_API_KEY);
    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["humans@relationaltechproject.org"],
      subject: `🌿 Contribution: ${title} — from ${contributor_name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; padding: 20px;">
          <h2 style="color: #3d3129; margin-bottom: 16px;">New Contribution to the Commons</h2>
          <div style="background: #f7f0e8; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${escapeHtml(title)}</p>
            <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${escapeHtml(contributor_name)} &lt;${escapeHtml(contributor_email)}&gt;</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #7a6d61;"><strong>User ID:</strong> ${user.id}</p>
            <p style="margin: 12px 0 4px 0;"><strong>Contribution:</strong></p>
            <p style="margin: 0; color: #3d3129; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(description)}</p>
            ${linksHtml}
            ${imagesHtml}
            <p style="margin: 16px 0 0 0; color: #7a6d61; font-size: 13px;">
              <strong>Submitted:</strong> ${timestamp} ET
            </p>
          </div>
          <p style="color: #7a6d61; font-size: 13px;">— Relational Tech Studio</p>
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
