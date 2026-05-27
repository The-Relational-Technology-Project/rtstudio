import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Share2, Check, Loader2, Copy, FileText, Map } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BuildPlanRow {
  id: string;
  title: string;
  detailed_prompt: string;
  plan_markdown: string;
  recommended_track: "lovable" | "claude_code" | null;
  share_id: string | null;
  is_shared: boolean;
  created_at: string;
}

const TRACK_LABELS: Record<string, string> = {
  lovable: "Lovable",
  claude_code: "Claude Code",
};

export const MyBuildPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<BuildPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ id: string; kind: "prompt" | "plan" | "share" } | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("build_plans")
      .select("id, title, detailed_prompt, plan_markdown, recommended_track, share_id, is_shared, created_at")
      .eq("builder_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      console.error("Error loading build plans:", error);
      return;
    }
    setItems((data || []) as BuildPlanRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const ensureShareable = async (p: BuildPlanRow): Promise<BuildPlanRow | null> => {
    if (p.is_shared && p.share_id) return p;
    setBusyId(p.id);
    const newShareId =
      p.share_id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14));
    const { data, error } = await supabase
      .from("build_plans")
      .update({ is_shared: true, share_id: newShareId })
      .eq("id", p.id)
      .select("id, title, detailed_prompt, plan_markdown, recommended_track, share_id, is_shared, created_at")
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      toast({ title: "Couldn't make shareable", description: error?.message, variant: "destructive" });
      return null;
    }
    setItems((prev) => prev.map((x) => (x.id === p.id ? (data as BuildPlanRow) : x)));
    return data as BuildPlanRow;
  };

  const handleOpen = async (p: BuildPlanRow) => {
    const ready = await ensureShareable(p);
    if (!ready?.share_id) return;
    window.open(`/plan/${ready.share_id}`, "_blank", "noopener,noreferrer");
  };

  const handleShare = async (p: BuildPlanRow) => {
    const ready = await ensureShareable(p);
    if (!ready?.share_id) return;
    const url = `${window.location.origin}/plan/${ready.share_id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied({ id: p.id, kind: "share" });
      toast({ title: "Share link copied", description: url });
      setTimeout(() => setCopied((c) => (c?.id === p.id && c?.kind === "share" ? null : c)), 2000);
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" });
    }
  };

  const handleCopy = async (p: BuildPlanRow, kind: "prompt" | "plan") => {
    const text = kind === "prompt" ? p.detailed_prompt : p.plan_markdown;
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ id: p.id, kind });
      toast({ title: kind === "prompt" ? "Detailed prompt copied" : "Plan copied" });
      setTimeout(() => setCopied((c) => (c?.id === p.id && c?.kind === kind ? null : c)), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="mb-8 p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold font-fraunces flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          My Build Plans
        </h2>
        {!loading && items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "plan" : "plans"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4">
          Your build plans will show up here. Start a chat with Sidekick to make one.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col p-4 rounded-lg bg-muted/40 border border-border hover:border-primary/40 transition-colors"
            >
              <p className="text-sm font-medium font-fraunces line-clamp-3 mb-1 break-words">{p.title}</p>
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                {p.recommended_track && TRACK_LABELS[p.recommended_track] && (
                  <>
                    <span>•</span>
                    <span>{TRACK_LABELS[p.recommended_track]}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1 min-w-[5rem]"
                  onClick={() => handleOpen(p)}
                  disabled={busyId === p.id}
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3 mr-1" />
                  )}
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => handleCopy(p, "prompt")}
                  title="Copy detailed prompt"
                >
                  {copied?.id === p.id && copied?.kind === "prompt" ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  Prompt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => handleCopy(p, "plan")}
                  title="Copy plan"
                >
                  {copied?.id === p.id && copied?.kind === "plan" ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Map className="h-3 w-3 mr-1" />
                  )}
                  Plan
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => handleShare(p)}
                  disabled={busyId === p.id}
                  title="Copy share link"
                >
                  {copied?.id === p.id && copied?.kind === "share" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Share2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
