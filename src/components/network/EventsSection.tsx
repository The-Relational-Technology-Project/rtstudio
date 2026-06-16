import { useEffect, useState } from "react";
import { ExternalLink, Calendar } from "lucide-react";

const EVENT_COUNT_CACHE_KEY = "rt_event_count";
const CACHE_DURATION = 5 * 60 * 1000;

function getCachedEventCount(): number | null {
  try {
    const cached = localStorage.getItem(EVENT_COUNT_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) return null;
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

export const EventsSection = () => {
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

  return (
    <section>
      <h2 className="text-2xl font-fraunces font-bold text-foreground mb-2 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        RT Events
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        {eventCount !== null && eventCount > 0
          ? `${eventCount} upcoming gathering${eventCount === 1 ? "" : "s"} across the network.`
          : "Upcoming gatherings across the network."}
      </p>

      {eventCount !== null && eventCount > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
          <iframe
            src="https://luma.com/embed/calendar/cal-nic0320bsY3RbWC/events?compact=true&lt=light"
            className="w-full border-0"
            style={{ height: 500 }}
            allowFullScreen
            aria-hidden="false"
            tabIndex={0}
            title="Relational Tech Events"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">
            No events coming up, check back soon.{" "}
            <a
              href="https://luma.com/relationaltech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              View calendar <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      )}
    </section>
  );
};
