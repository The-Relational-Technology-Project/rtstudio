const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LUMA_URL = "https://luma.com/calendar/cal-nic0320bsY3RbWC/events";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch(LUMA_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await res.text();
    const now = new Date();

    // Extract event count from JSON-LD embedded in the page
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        const events = ld.events || [];
        const futureCount = events.filter((e: any) => {
          const start = new Date(e.startDate);
          return start >= now;
        }).length;

        return new Response(JSON.stringify({ count: futureCount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // JSON-LD parse failed, fall through
      }
    }

    return new Response(JSON.stringify({ count: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ count: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
