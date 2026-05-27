import { useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";
import { HomeSidebar } from "@/components/HomeSidebar";
import { BuildPlanPreview, type BuildPlanData } from "@/components/BuildPlanPreview";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSidekick } from "@/contexts/SidekickContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MessageSquare, Calendar, Bell, ChevronLeft, ChevronRight } from "lucide-react";

type MobileTab = "sidekick" | "events" | "updates";

const Home = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { messages, setMessages } = useSidekick();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MobileTab>("sidekick");

  // Build plan state
  const [buildPlan, setBuildPlan] = useState<BuildPlanData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plansRemaining, setPlansRemaining] = useState(10);
  const buildAbortRef = useRef<AbortController | null>(null);

  // Recovery lookup: if the response never makes it back, the plan row may
  // still have been written. Find the most recent plan for this builder.
  const findRecentBuildPlan = async (sinceISO: string): Promise<BuildPlanData | null> => {
    if (!user?.id) return null;
    const { data, error } = await (supabase as any)
      .from("build_plans")
      .select("id, title, detailed_prompt, plan_markdown, recommended_track, share_id, is_shared, created_at")
      .eq("builder_id", user.id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Recovery lookup error:", error);
      return null;
    }
    return (data as BuildPlanData) ?? null;
  };

  const handleCreateBuildPlan = async (draftPrompt: string, libraryItemIds: string[]) => {
    if (isGenerating) return;
    setIsGenerating(true);
    const startedAt = new Date().toISOString();
    const controller = new AbortController();
    buildAbortRef.current = controller;
    // 4-minute ceiling — Opus 4.7 with caching should be much faster, but allow headroom.
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 4 * 60 * 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/generate-build-plan`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          draft_prompt: draftPrompt,
          chat_messages: messages.slice(-12),
          library_item_ids: libraryItemIds,
        }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Build plan failed (${res.status})`);
      }

      setBuildPlan(data.plan as BuildPlanData);
      if (typeof data.remaining === "number") setPlansRemaining(data.remaining);

      setMessages((prev) => [...prev, {
        role: "assistant" as const,
        content: "Your build plan is ready below. Copy the detailed prompt into your builder of choice, and walk through the plan when you're ready to share with a neighbor.",
      }]);
    } catch (error) {
      console.error("Build plan generation error:", error);
      const aborted = (error as any)?.name === "AbortError" || controller.signal.aborted;

      const recovered = await findRecentBuildPlan(startedAt);
      if (recovered) {
        setBuildPlan(recovered);
        setMessages((prev) => [...prev, {
          role: "assistant" as const,
          content: "Your build plan finished — it's below. (The connection dropped on the way back, but the plan itself made it through.)",
        }]);
      } else if (aborted) {
        toast({
          title: "Plan generation is taking longer than expected",
          description: "It may still be running. Wait a moment and check your profile — your build plan will appear if it finished. Otherwise, try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Couldn't create the build plan",
          description: error instanceof Error ? error.message : "Something went wrong. Try again or simplify your prompt.",
          variant: "destructive",
        });
      }
    } finally {
      window.clearTimeout(timeoutId);
      buildAbortRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleTitleSaved = (newTitle: string) => {
    setBuildPlan((prev) => (prev ? { ...prev, title: newTitle } : prev));
  };

  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: "sidekick", label: "Sidekick", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "events", label: "Events", icon: <Calendar className="h-4 w-4" /> },
    { id: "updates", label: "Updates", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />

      {/* Mobile tab bar */}
      {isMobile && (
        <div className="flex border-b border-border bg-card/50 sticky top-14 z-40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 w-full">
        {isMobile ? (
          <div className="w-full">
            {activeTab === "sidekick" && (
              <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
                <Sidekick fullPage onCreateBuildPlan={handleCreateBuildPlan} plansRemaining={plansRemaining} previewSlot={buildPlan ? <BuildPlanPreview plan={buildPlan} onTitleSaved={handleTitleSaved} /> : isGenerating ? <BuildPlanPreview plan={null} isGenerating /> : null} />
              </div>
            )}
            {activeTab === "events" && (
              <div className="px-4 py-6">
                <HomeSidebar section="events" />
              </div>
            )}
            {activeTab === "updates" && (
              <div className="px-4 py-6">
                <HomeSidebar section="updates" />
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto flex gap-0">
            {/* Sidekick column */}
            <div className="flex-1 min-w-0 px-4 py-8 space-y-4">
              <Sidekick fullPage onCreateBuildPlan={handleCreateBuildPlan} plansRemaining={plansRemaining} previewSlot={buildPlan ? <BuildPlanPreview plan={buildPlan} onTitleSaved={handleTitleSaved} /> : isGenerating ? <BuildPlanPreview plan={null} isGenerating /> : null} />
            </div>

            {/* Sidebar toggle + sidebar */}
            <div className="flex">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="self-start mt-8 w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>

              <div
                className={cn(
                  "transition-all duration-300 overflow-hidden",
                  sidebarOpen ? "w-[280px] opacity-100" : "w-0 opacity-0"
                )}
              >
                <div className="w-[280px] pt-16 py-8 pr-4">
                  <HomeSidebar />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
