import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Calendar, Radio, Wrench, ChevronDown, ChevronRight } from "lucide-react";
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

interface HomeSidebarProps {
  section?: "events" | "updates";
}

const RSS_CACHE_KEY = "rt_network_feed";
const RSS_CACHE_DURATION = 15 * 60 * 1000;
const EVENT_COUNT_CACHE_KEY = "rt_event_count";

function parseRSS(xml: string): RSSItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const items = doc.querySelectorAll("item");
    const result: RSSItem[] = [];
    items.forEach((item, i) => {
      if (i >= 3) return;
      result.push({
        title: item.querySelector("title")?.textContent || "",
        link: item.querySelector("link")?.textContent || "",
        pubDate: item.querySelector("pubDate")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
      });
    });
    return result;
  } catch {
    return [];
  }
}

/** Extract project name from RSS title like "cozy-corner: 15 commits by lovable-dev[bot]" */
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

function getCachedEventCount(): number | null {
  try {
    const cached = localStorage.getItem(EVENT_COUNT_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > RSS_CACHE_DURATION) return null;
    return parsed.count;
  } catch {
    return null;
  }
}

function cacheEventCount(count: number) {
  localStorage.setItem(
    EVENT_COUNT_CACHE_KEY,
    JSON.stringify({ count, timestamp: Date.now() })
  );
}

const EventsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const [eventCount, setEventCount] = useState<number | null>(null);

  useEffect(() => {
    const cached = getCachedEventCount();
    if (cached !== null) {
      setEventCount(cached);
      return;
    }

    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/luma-event-count`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count === "number") {
          setEventCount(data.count);
          cacheEventCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  const countLabel =
    eventCount !== null && eventCount > 0
      ? `${eventCount} upcoming`
      : "Upcoming events";

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-fraunces font-bold text-foreground mb-3 hover:text-primary transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          RT Events — {countLabel}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
          <iframe
            src="https://luma.com/embed/calendar/cal-nic0320bsY3RbWC/events?compact=true&lt=light"
            className="w-full border-0"
            style={{ height: 300 }}
            allowFullScreen
            aria-hidden="false"
            tabIndex={0}
            title="Relational Tech Events"
          />
        </div>
      )}
    </section>
  );
};

const RTUpdatesSection = () => {
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
          // Summaries are optional
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
      <h3 className="text-sm font-fraunces font-bold text-foreground flex items-center gap-1.5 mb-3">
        <Radio className="h-3.5 w-3.5 text-primary" />
        Network Updates
      </h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent updates.</p>
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
                className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors group"
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {displayText}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
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
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all updates <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
};

const StudioUpdatesSection = () => {
  const [entries, setEntries] = useState<StudioLogEntry[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase
        .from("studio_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4)) as any;
      if (data) setEntries(data);
    };
    fetch();
  }, []);

  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-fraunces font-bold text-foreground flex items-center gap-1.5 mb-3">
        <Wrench className="h-3.5 w-3.5 text-primary" />
        Studio Updates
      </h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="text-xs mt-0.5">
                {entry.log_type === "contribution" ? "🌱" : "✨"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {entry.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {entry.description}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
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

export const HomeSidebar = ({ section }: HomeSidebarProps) => {
  if (section === "events") return <EventsSection />;
  if (section === "updates") {
    return (
      <div className="space-y-8">
        <RTUpdatesSection />
        <StudioUpdatesSection />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EventsSection />
      <RTUpdatesSection />
      <StudioUpdatesSection />
    </div>
  );
};
