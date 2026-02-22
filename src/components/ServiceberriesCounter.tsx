import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Serviceberry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string | null;
}

// Berry color config — each reason maps to an HSL fill and a label
const BERRY_CONFIG: Record<string, { fill: string; label: string; meaning: string }> = {
  profile_setup:        { fill: "hsl(38, 92%, 50%)",  label: "Profile setup",          meaning: "Planting your roots" },
  first_chat:           { fill: "hsl(38, 92%, 50%)",  label: "First chat",             meaning: "Planting your roots" },
  commitment_completed: { fill: "hsl(152, 60%, 36%)", label: "Commitment completed",   meaning: "Following through" },
  commitment_made:      { fill: "hsl(140, 30%, 60%)", label: "Commitment made",         meaning: "Setting intentions" },
  library_contribution: { fill: "hsl(199, 89%, 48%)", label: "Library contribution",    meaning: "Building for others" },
  story_shared:         { fill: "hsl(350, 70%, 56%)", label: "Story shared",            meaning: "Sharing your experience" },
  prompt_shared:        { fill: "hsl(270, 60%, 58%)", label: "Prompt shared",           meaning: "Offering imagination" },
};

const DEFAULT_BERRY = { fill: "hsl(220, 15%, 60%)", label: "Contribution", meaning: "Giving to the commons" };

function getBerryConfig(reason: string) {
  return BERRY_CONFIG[reason] || DEFAULT_BERRY;
}

// Deterministic pseudo-random offset from a seed string
function seededOffset(seed: string, index: number, range: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return ((hash % 1000) / 1000) * range - range / 2;
}

// --- BerryBunch: renders an organic SVG cluster of colored circles ---

interface BerryBunchProps {
  berryMap: Map<string, number>;
  size?: number; // overall SVG size
  maxPerType?: number;
}

const BerryBunch = ({ berryMap, size = 120, maxPerType = 5 }: BerryBunchProps) => {
  const berries = useMemo(() => {
    const items: { fill: string; cx: number; cy: number }[] = [];
    const center = size / 2;
    const radius = size * 0.32;
    const berryR = size * 0.075;

    const types = Array.from(berryMap.entries());
    const totalTypes = types.length;
    if (totalTypes === 0) return items;

    // Distribute types in arcs around center
    types.forEach(([reason, count], typeIdx) => {
      const config = getBerryConfig(reason);
      const capped = Math.min(count, maxPerType);
      const angleBase = (typeIdx / totalTypes) * Math.PI * 2 - Math.PI / 2;

      for (let i = 0; i < capped; i++) {
        const dist = radius * (0.3 + (i / Math.max(capped, 1)) * 0.7);
        const angleJitter = seededOffset(reason, i, 0.45);
        const distJitter = seededOffset(reason + "d", i, berryR * 1.5);
        const angle = angleBase + angleJitter;
        const cx = center + Math.cos(angle) * (dist + distJitter);
        const cy = center + Math.sin(angle) * (dist + distJitter);
        items.push({ fill: config.fill, cx, cy });
      }
    });

    return items;
  }, [berryMap, size, maxPerType]);

  const berryR = size * 0.075;

  if (berries.length === 0) {
    // Empty state: single outlined berry
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={berryR * 1.5}
          fill="none"
          stroke="hsl(220, 15%, 70%)"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {berries.map((b, i) => (
        <circle
          key={i}
          cx={b.cx}
          cy={b.cy}
          r={berryR}
          fill={b.fill}
          opacity={0.88}
        />
      ))}
    </svg>
  );
};

// --- Legend ---

interface BerryLegendProps {
  berryMap: Map<string, number>;
}

const BerryLegend = ({ berryMap }: BerryLegendProps) => {
  const types = Array.from(berryMap.keys());
  if (types.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
      {types.map((reason) => {
        const config = getBerryConfig(reason);
        return (
          <div key={reason} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: config.fill }}
            />
            {config.meaning}
          </div>
        );
      })}
    </div>
  );
};

// --- Main component ---

interface ServiceberriesCounterProps {
  variant?: "nav" | "profile";
}

export const ServiceberriesCounter = ({ variant = "nav" }: ServiceberriesCounterProps) => {
  const { user } = useAuth();

  const [history, setHistory] = useState<Serviceberry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const berryMap = useMemo(() => {
    const m = new Map<string, number>();
    history.forEach((b) => {
      m.set(b.reason, (m.get(b.reason) || 0) + 1);
    });
    return m;
  }, [history]);

  useEffect(() => {
    if (user) fetchServiceberries();
  }, [user]);

  useEffect(() => {
    if (isOpen && user) fetchServiceberries();
  }, [isOpen, user]);

  const fetchServiceberries = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("serviceberries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching serviceberries:", error);
    } else {
      setHistory(data || []);
    }
    setIsLoading(false);
  };

  if (variant === "nav") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-foreground px-2"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BerryBunch berryMap={berryMap} size={22} maxPerType={2} />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Serviceberries</DialogTitle>
          </DialogHeader>
          <ServiceberriesContent history={history} berryMap={berryMap} isLoading={isLoading} />
        </DialogContent>
      </Dialog>
    );
  }

  // Profile variant
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Serviceberries</h2>
      <ServiceberriesContent history={history} berryMap={berryMap} isLoading={isLoading} />
    </div>
  );
};

// --- Content (shared between dialog and profile) ---

interface ServiceberriesContentProps {
  history: Serviceberry[];
  berryMap: Map<string, number>;
  isLoading: boolean;
}

const ServiceberriesContent = ({ history, berryMap, isLoading }: ServiceberriesContentProps) => {
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Berry bunch visual */}
      <div className="flex flex-col items-center gap-3 py-2">
        <BerryBunch berryMap={berryMap} size={120} maxPerType={5} />
        <BerryLegend berryMap={berryMap} />
      </div>

      {/* Activity ledger */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Gift Ledger</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete your profile to gather your first serviceberry!
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {history.slice(0, 15).map((berry) => {
              const config = getBerryConfig(berry.reason);
              return (
                <div
                  key={berry.id}
                  className="flex items-center gap-2.5 p-2 bg-muted/50 rounded"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: config.fill }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {berry.created_at &&
                        formatDistanceToNow(new Date(berry.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Each berry marks a gift to the commons — your contributions to neighbors and place.
        </p>
      </div>
    </div>
  );
};
