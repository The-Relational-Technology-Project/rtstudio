import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Hammer, ExternalLink, Share2, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PrototypeRow {
  id: string;
  prompt: string;
  tool_name: string | null;
  created_at: string;
  is_shared: boolean;
  share_id: string | null;
}

export const MyPrototypes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PrototypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("prototypes")
      .select("id, prompt, tool_name, created_at, is_shared, share_id")
      .eq("builder_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("Error loading prototypes:", error);
      return;
    }
    setItems((data || []) as PrototypeRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const titleFor = (p: PrototypeRow) => {
    if (p.tool_name && p.tool_name.trim()) return p.tool_name;
    const t = p.prompt?.trim() || "Untitled prototype";
    return t.length > 60 ? t.slice(0, 60) + "…" : t;
  };

  const ensureShareable = async (p: PrototypeRow): Promise<PrototypeRow | null> => {
    if (p.is_shared && p.share_id) return p;
    setBusyId(p.id);
    const newShareId =
      p.share_id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14));
    const { data, error } = await supabase
      .from("prototypes")
      .update({ is_shared: true, share_id: newShareId })
      .eq("id", p.id)
      .select("id, prompt, tool_name, created_at, is_shared, share_id")
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      toast({ title: "Couldn't make shareable", description: error?.message, variant: "destructive" });
      return null;
    }
    setItems((prev) => prev.map((x) => (x.id === p.id ? (data as PrototypeRow) : x)));
    return data as PrototypeRow;
  };

  const handleOpen = async (p: PrototypeRow) => {
    const ready = await ensureShareable(p);
    if (!ready?.share_id) return;
    window.open(`/p/${ready.share_id}`, "_blank", "noopener,noreferrer");
  };

  const handleShare = async (p: PrototypeRow) => {
    const ready = await ensureShareable(p);
    if (!ready?.share_id) return;
    const url = `${window.location.origin}/p/${ready.share_id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(p.id);
      toast({ title: "Link copied", description: url });
      setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 2000);
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" });
    }
  };

  return (
    <div className="mb-8 p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold font-fraunces flex items-center gap-2">
          <Hammer className="h-4 w-4 text-primary" />
          My Prototypes
        </h2>
        {!loading && items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "build" : "builds"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4">
          You haven't built any prototypes yet. Try building one from a Sidekick conversation.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col p-4 rounded-lg bg-muted/40 border border-border hover:border-primary/40 transition-colors"
            >
              <p className="text-sm font-medium line-clamp-3 mb-2 break-words">{titleFor(p)}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
              </p>
              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpen(p)}
                  disabled={busyId === p.id}
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleShare(p)}
                  disabled={busyId === p.id}
                  title="Copy share link"
                >
                  {copiedId === p.id ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
