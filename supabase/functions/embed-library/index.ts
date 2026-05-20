import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-embedding-001",
      input: texts,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lovable AI embeddings error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

function contentHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check: ADMIN_API_KEY OR service_role (for scheduled cron)
    const authHeader = req.headers.get("Authorization");
    const adminKey = Deno.env.get("ADMIN_API_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!adminKey || !lovableKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expectedAdmin = `Bearer ${adminKey}`;
    const expectedService = `Bearer ${serviceRoleKey}`;
    if (!authHeader || (authHeader !== expectedAdmin && authHeader !== expectedService)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all library items
    const [storiesRes, promptsRes, toolsRes] = await Promise.all([
      supabase.from("stories").select("id, title, story_text, attribution, full_story_text"),
      supabase.from("prompts").select("id, title, category, description, example_prompt"),
      supabase.from("tools").select("id, name, description, url, tool_category, summary"),
    ]);

    // Build items to embed
    const items: { item_type: string; item_id: string; text: string }[] = [];

    for (const story of (storiesRes.data || [])) {
      const text = [
        story.title || "Untitled",
        story.attribution,
        story.story_text,
        story.full_story_text?.slice(0, 500),
      ].filter(Boolean).join(" | ");
      items.push({ item_type: "story", item_id: story.id, text });
    }

    for (const prompt of (promptsRes.data || [])) {
      const text = [
        prompt.title,
        prompt.category,
        prompt.description,
        prompt.example_prompt?.slice(0, 500),
      ].filter(Boolean).join(" | ");
      items.push({ item_type: "prompt", item_id: prompt.id, text });
    }

    for (const tool of (toolsRes.data || [])) {
      const text = [
        tool.name,
        tool.tool_category,
        tool.summary,
        tool.description?.slice(0, 500),
      ].filter(Boolean).join(" | ");
      items.push({ item_type: "tool", item_id: tool.id, text });
    }

    // Fetch existing embeddings to skip unchanged items
    const { data: existing } = await supabase
      .from("library_embeddings")
      .select("item_type, item_id, content_hash");

    const existingMap = new Map(
      (existing || []).map((e: any) => [`${e.item_type}:${e.item_id}`, e.content_hash])
    );

    // Filter to items that need embedding
    const toEmbed = items.filter((item) => {
      const hash = contentHash(item.text);
      const key = `${item.item_type}:${item.item_id}`;
      return existingMap.get(key) !== hash;
    });

    console.log(`Total items: ${items.length}, need embedding: ${toEmbed.length}`);

    if (toEmbed.length === 0) {
      return new Response(JSON.stringify({ message: "All embeddings up to date", total: items.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Embed in batches of 50
    let embedded = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);
      const texts = batch.map((b) => b.text);
      const embeddings = await getEmbeddings(texts, openaiKey);

      // Upsert into library_embeddings
      const rows = batch.map((item, idx) => ({
        item_type: item.item_type,
        item_id: item.item_id,
        content_hash: contentHash(item.text),
        embedding: JSON.stringify(embeddings[idx]),
      }));

      const { error } = await supabase
        .from("library_embeddings")
        .upsert(rows, { onConflict: "item_type,item_id" });

      if (error) {
        console.error("Upsert error:", error);
        throw new Error(`Failed to upsert embeddings: ${error.message}`);
      }

      embedded += batch.length;
    }

    return new Response(
      JSON.stringify({ message: "Embeddings updated", total: items.length, embedded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("embed-library error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
