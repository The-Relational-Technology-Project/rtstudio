import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Copy,
  Check,
  Pencil,
  Share2,
  Sparkles,
  FileText,
  Map,
  HandshakeIcon,
  Loader2,
} from "lucide-react";

export interface BuildPlanData {
  id: string;
  title: string;
  detailed_prompt: string;
  plan_markdown: string;
  recommended_track: "lovable" | "claude_code" | null;
  share_id: string | null;
  is_shared: boolean;
  created_at: string;
}

interface BuildPlanPreviewProps {
  plan: BuildPlanData | null;
  onTitleSaved?: (newTitle: string) => void;
  isGenerating?: boolean;
}

const TRACK_LABELS: Record<string, string> = {
  lovable: "Lovable track",
  claude_code: "Claude Code track",
};

export const BuildPlanPreview = ({ plan, onTitleSaved, isGenerating }: BuildPlanPreviewProps) => {
  const { toast } = useToast();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(plan?.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [copied, setCopied] = useState<"prompt" | "plan" | "share" | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareState, setShareState] = useState({
    is_shared: plan?.is_shared ?? false,
    share_id: plan?.share_id ?? null,
  });

  useEffect(() => {
    setTitleDraft(plan?.title ?? "");
    setShareState({ is_shared: plan?.is_shared ?? false, share_id: plan?.share_id ?? null });
  }, [plan?.id, plan?.title, plan?.is_shared, plan?.share_id]);

  if (isGenerating && !plan) {
    return (
      <Card className="mt-4 border-2 border-primary/30 bg-primary/5 p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Drafting your detailed prompt and plan…</p>
        <p className="text-xs text-muted-foreground">This usually takes 20–40 seconds.</p>
      </Card>
    );
  }

  if (!plan) return null;

  const copyToClipboard = async (text: string, kind: "prompt" | "plan" | "share") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast({
        title:
          kind === "prompt"
            ? "Detailed prompt copied"
            : kind === "plan"
            ? "Plan copied"
            : "Share link copied",
      });
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 2000);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next || next === plan.title) {
      setEditingTitle(false);
      setTitleDraft(plan.title);
      return;
    }
    setSavingTitle(true);
    const { error } = await (supabase as any).from("build_plans").update({ title: next }).eq("id", plan.id);
    setSavingTitle(false);
    if (error) {
      toast({ title: "Couldn't save title", description: error.message, variant: "destructive" });
      return;
    }
    onTitleSaved?.(next);
    setEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setTitleDraft(plan.title);
    setEditingTitle(false);
  };

  const ensureShared = async (): Promise<{ shareId: string } | null> => {
    if (shareState.is_shared && shareState.share_id) return { shareId: shareState.share_id };
    setSharing(true);
    const newShareId =
      shareState.share_id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14));
    const { data, error } = await supabase
      .from("build_plans")
      .update({ is_shared: true, share_id: newShareId })
      .eq("id", plan.id)
      .select("share_id, is_shared")
      .maybeSingle();
    setSharing(false);
    if (error || !data) {
      toast({ title: "Couldn't make shareable", description: error?.message, variant: "destructive" });
      return null;
    }
    setShareState({ is_shared: true, share_id: data.share_id as string });
    return { shareId: data.share_id as string };
  };

  const handleShare = async () => {
    const ready = await ensureShared();
    if (!ready) return;
    const url = `${window.location.origin}/plan/${ready.shareId}`;
    await copyToClipboard(url, "share");
  };

  return (
    <Card className="mt-4 border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-primary/15 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          {editingTitle ? (
            <div className="flex-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") cancelTitleEdit();
                }}
                autoFocus
                className="h-9 text-base font-fraunces"
                maxLength={120}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveTitle} disabled={savingTitle}>
                  <Check className="h-3 w-3 mr-1" />
                  {savingTitle ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelTitleEdit} disabled={savingTitle}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-left flex items-center gap-2 group min-w-0"
              title="Click to rename"
            >
              <h3 className="text-lg sm:text-xl font-bold font-fraunces truncate">{plan.title}</h3>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>
        {plan.recommended_track && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
            {TRACK_LABELS[plan.recommended_track] || plan.recommended_track}
          </span>
        )}
      </div>

      <Tabs defaultValue="prompt" className="w-full">
        <div className="px-4 sm:px-6 pt-3">
          <TabsList>
            <TabsTrigger value="prompt" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Detailed prompt
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs">
              <Map className="h-3.5 w-3.5 mr-1" />
              Plan
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="prompt" className="px-4 sm:px-6 pb-4 pt-3 space-y-3 mt-0">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(plan.detailed_prompt, "prompt")}
              className="h-8 text-xs"
            >
              {copied === "prompt" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              Copy detailed prompt
            </Button>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:font-fraunces prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground">
            <ReactMarkdown>{plan.detailed_prompt}</ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="px-4 sm:px-6 pb-4 pt-3 space-y-3 mt-0">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(plan.plan_markdown, "plan")}
              className="h-8 text-xs"
            >
              {copied === "plan" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              Copy plan
            </Button>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:font-fraunces prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground">
            <ReactMarkdown>{plan.plan_markdown}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>

      <div className="px-4 sm:px-6 py-3 border-t border-primary/15 flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                <HandshakeIcon className="h-3.5 w-3.5 mr-1" />
                Talk to an RTP steward
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming next — Sidekick will offer this once the plan is ready.</TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleShare} disabled={sharing}>
          {copied === "share" ? (
            <Check className="h-3.5 w-3.5 mr-1" />
          ) : sharing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Share2 className="h-3.5 w-3.5 mr-1" />
          )}
          Share link
        </Button>
        <span className="text-xs text-muted-foreground flex items-center ml-auto">
          Saved to your profile
        </span>
      </div>
    </Card>
  );
};
