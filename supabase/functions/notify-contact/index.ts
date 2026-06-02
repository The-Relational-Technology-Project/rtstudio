import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BRAND = {
  primary: "#c2622d",
  background: "#f7f0e8",
  foreground: "#3d3129",
  muted: "#7a6d61",
};

interface Payload {
  name?: string;
  email?: string;
  place?: string;
  message?: string;
  website?: string; // honeypot
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    // Honeypot: silently succeed
    if (body.website && body.website.trim().length > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const place = (body.place ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!name || name.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !isEmail(email) || email.length > 320) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (place.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid place" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:${BRAND.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.background};padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e8e0d8;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:${BRAND.foreground};">New contact form message</h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};"><strong style="color:${BRAND.foreground};">From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
          ${place ? `<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};"><strong style="color:${BRAND.foreground};">Place:</strong> ${escapeHtml(place)}</p>` : ""}
          <p style="margin:0 0 16px;font-size:12px;color:${BRAND.muted};">${new Date().toUTCString()}</p>
          <div style="background:${BRAND.background};border-radius:8px;padding:16px;font-size:15px;line-height:1.6;color:${BRAND.foreground};white-space:pre-wrap;">${escapeHtml(message)}</div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:${BRAND.background};border-top:1px solid #e8e0d8;text-align:center;">
          <p style="margin:0;font-size:12px;color:${BRAND.muted};">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const emailResponse = await resend.emails.send({
      from: "Relational Tech Studio <notifications@relationaltechproject.org>",
      to: ["humans@relationaltechproject.org"],
      reply_to: email,
      subject: `New contact form message from ${name}`,
      html,
    });

    console.log("notify-contact sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("notify-contact error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
