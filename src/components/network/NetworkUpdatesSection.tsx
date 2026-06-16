import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Radio, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

interface StudioLogEntry {
  id: string;
  created_at: string;
  log_type: string;
  title: string;
  description: string;
  url: string | null;
}

const RSS_CACHE_KEY = "rt_network_feed";
const RSS_CACHE_DURATION = 5 * 60 * 1000;

function parseRSS(xml: string): RSSItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const items = doc.querySelectorAll("item");
    const result: RSSItem[] = [];
    items.forEach((item) => {
      result.push({
        title: item.querySelector("title")?.textContent || "",
        link: item.querySelector("link")?.textContent || "",
        pubDate: item.querySelector("pubDate")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
      });
    });
    result.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return result.slice(0, 6);
  } catch {
    return [];
  }
}

function extractProjectName(title: string): string {
  const colonIdx = title.indexOf(":");
  if (colonIdx > 0) return title.slice(0, colonIdx).trim();
  return title;
}

interface CachedFeed {
  items: RSSItem[];
  summaries: string[];
  timestamp: number;
}

function getCachedFeed(): CachedFeed | null {
  try {
    const cached = localStorage.getItem(RSS_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > RSS_CACHE_DURATION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheFeedWithSummaries(items: RSSItem[], summaries: string[]) {
  localStorage.setItem(
    RSS_CACHE_KEY,
    JSON.stringify({ items, summaries, timestamp: Date.now() })
  );
}

const RTUpdates = () => {
  const [items, setItems] = useState<RSSItem[]>([]);
  const [summaries, setSummaries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedFeed();
    if (cached) {
      setItems(cached.items);
      setSummaries(cached.summaries || []);
      setLoading(false);
      return;
    }

    fetch("https://updates.relationaltechproject.org/feed.xml")
      .then((r) => r.text())
      .then(async (xml) => {
        const parsed = parseRSS(xml);
        let aiSummaries: string[] = [];
        try {
          const descriptions = parsed.map((p) => p.description).filter(Boolean);
          if (descriptions.length > 0) {
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-feed`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ descriptions }),
              }
            );
            if (res.ok) {
              const data = await res.json();
              aiSummaries = data.summaries || [];
            }
          }
        } catch {
          // optional
        }
        cacheFeedWithSummaries(parsed, aiSummaries);
        setItems(parsed);
        setSummaries(aiSummaries);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h3 className="text-lg font-fraunces font-bold text-foreground flex items-center gap-2 mb-4">
        <Radio className="h-4 w-4 text-primary" />
        Network Updates
      </h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent updates.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const displayText = summaries[i] || item.description || item.title;
            const projectName = extractProjectName(item.title);
            return (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors group bg-card"
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {displayText}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {projectName}
                </p>
                {item.pubDate && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
                  </p>
                )}
              </a>
            );
          })}
          <a
            href="https://updates.relationaltechproject.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline pt-1"
          >
            View all updates <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
};

const StudioUpdates = () => {
  const [entries, setEntries] = useState<StudioLogEntry[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data } = await (supabase
        .from("studio_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8)) as any;
      if (data) setEntries(data);
    };
    fetchEntries();
  }, []);

  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-fraunces font-bold text-foreground flex items-center gap-2 mb-4">
        <Wrench className="h-4 w-4 text-primary" />
        Studio Updates
      </h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-start gap-2.5">
              <span className="text-sm mt-0.5">
                {entry.log_type === "contribution" ? "🌱" : "✨"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {entry.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {entry.description}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const NetworkUpdatesSection = () => {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-fraunces font-bold text-foreground mb-2">
          What's shipping
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Live updates from across the relational tech network and from this Studio.
        </p>
      </div>
      <RTUpdates />
      <StudioUpdates />
    </div>
  );
};
