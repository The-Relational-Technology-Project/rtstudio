import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, FileText, Map, Sparkles, ExternalLink } from "lucide-react";

interface SharedPlan {
  title: string;
  detailed_prompt: string;
  plan_markdown: string;
  recommended_track: "lovable" | "claude_code" | null;
}

const TRACK_LABELS: Record<string, string> = {
  lovable: "Lovable track",
  claude_code: "Claude Code track",
};

const BuildPlanShare = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"prompt" | "plan" | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchPlan = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/build_plans?share_id=eq.${encodeURIComponent(shareId)}&select=title,detailed_prompt,plan_markdown,recommended_track`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const items = await response.json().catch(() => []);
      const data = Array.isArray(items) ? items[0] : null;

      if (!data) {
        setError("Build plan not found");
        setLoading(false);
        return;
      }

      setPlan(data as SharedPlan);
      setLoading(false);
    };

    fetchPlan();
  }, [shareId]);

  const copy = async (text: string, kind: "prompt" | "plan") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast({ title: kind === "prompt" ? "Detailed prompt copied" : "Plan copied" });
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 2000);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading build plan…</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg text-foreground">{error || "Not found"}</p>
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Back to Relational Tech Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">
          A neighbor is building something —{" "}
          <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
            Built with Relational Tech Studio
            <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <Card className="border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-primary/15 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <h1 className="text-lg sm:text-xl font-bold font-fraunces">{plan.title}</h1>
            </div>
            {plan.recommended_track && TRACK_LABELS[plan.recommended_track] && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                {TRACK_LABELS[plan.recommended_track]}
              </span>
            )}
          </div>

          <Tabs defaultValue="plan" className="w-full">
            <div className="px-4 sm:px-6 pt-3">
              <TabsList>
                <TabsTrigger value="plan" className="text-xs">
                  <Map className="h-3.5 w-3.5 mr-1" />
                  Plan
                </TabsTrigger>
                <TabsTrigger value="prompt" className="text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Detailed prompt
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="prompt" className="px-4 sm:px-6 pb-4 pt-3 space-y-3 mt-0">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(plan.detailed_prompt, "prompt")}
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
                  onClick={() => copy(plan.plan_markdown, "plan")}
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
        </Card>
      </main>
    </div>
  );
};

export default BuildPlanShare;
