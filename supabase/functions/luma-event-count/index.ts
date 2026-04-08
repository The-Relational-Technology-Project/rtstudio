const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ICAL_URL = "https://luma.com/calendar/cal-nic0320bsY3RbWC/export.ics";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) {
      return new Response(JSON.stringify({ count: 0, error: "Failed to fetch iCal" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const text = await res.text();
    const now = new Date();
    
    // Parse VEVENT blocks and count future events
    const events = text.split("BEGIN:VEVENT");
    let count = 0;
    
    for (let i = 1; i < events.length; i++) {
      const block = events[i];
      const dtStartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6}Z?)/);
      if (dtStartMatch) {
        const raw = dtStartMatch[1];
        // Parse YYYYMMDD or YYYYMMDDTHHmmssZ
        const year = parseInt(raw.slice(0, 4));
        const month = parseInt(raw.slice(4, 6)) - 1;
        const day = parseInt(raw.slice(6, 8));
        const hour = raw.length >= 13 ? parseInt(raw.slice(9, 11)) : 0;
        const min = raw.length >= 13 ? parseInt(raw.slice(11, 13)) : 0;
        const sec = raw.length >= 15 ? parseInt(raw.slice(13, 15)) : 0;
        
        const eventDate = raw.endsWith("Z")
          ? new Date(Date.UTC(year, month, day, hour, min, sec))
          : new Date(year, month, day, hour, min, sec);
        
        if (eventDate >= now) {
          count++;
        }
      }
    }

    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ count: 0, error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
