import { useCallback, useRef, useState } from "react";

import { Sidekick } from "@/components/Sidekick";
import { LibraryItemPreview } from "@/components/LibraryItemPreview";
import { BuildPlanPreview, type BuildPlanData } from "@/components/BuildPlanPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useSidekick } from "@/contexts/SidekickContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LibraryItemData {
  id: string;
  type: "story" | "prompt" | "tool";
  title: string;
  summary: string;
  author?: string;
  category?: string;
}

const Home = () => {
  const { user } = useAuth();
  const { messages, setMessages } = useSidekick();
  const { toast } = useToast();

  const [buildPlan, setBuildPlan] = useState<BuildPlanData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plansRemaining, setPlansRemaining] = useState(10);
  const [libraryItems, setLibraryItems] = useState<LibraryItemData[]>([]);
  const buildAbortRef = useRef<AbortController | null>(null);

  const handleLibraryItemsChange = useCallback((items: LibraryItemData[]) => {
    setLibraryItems(items);
  }, []);

  const findRecentBuildPlan = async (sinceISO: string): Promise<BuildPlanData | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
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

  const handleCreateBuildPlan = async (libraryItemIds: string[]) => {
    if (isGenerating) return;
    setIsGenerating(true);
    const startedAt = new Date().toISOString();
    const controller = new AbortController();
    buildAbortRef.current = controller;
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
          chat_messages: messages.slice(-20),
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
        content: "Your build plan is ready below. Copy the detailed prompt into your builder of choice, and walk through the plan when you're ready to share with a neighbor.\n\nWhen you're set with it: want me to introduce you to an RTP steward (Josh from the team), or to someone in the network building something adjacent? Either way I'd share your plan — and you can choose whether to include our chat.\n\nAnd if there are concrete next steps for you — \"show this to Maya by Saturday,\" \"sign up for Lovable\" — I can save those to your profile so you don't lose them.",
      }]);
    } catch (error) {
      console.error("Build plan generation error:", error);
      const aborted = (error as any)?.name === "AbortError" || controller.signal.aborted;

      const recovered = await findRecentBuildPlan(startedAt);
      if (recovered) {
        setBuildPlan(recovered);
        setMessages((prev) => [...prev, {
          role: "assistant" as const,
          content: "Your build plan finished — it's below. (The connection dropped on the way back, but the plan itself made it through.)\n\nWhen you're set with it: want me to introduce you to an RTP steward, or someone in the network building something adjacent? I'd share your plan with them — your call on whether to share our chat. And if there are concrete next steps you want saved to your profile, just tell me.",
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

  const showLibraryAside = libraryItems.length > 0;

  return (
    // Full-bleed chat: fills viewport minus the TopNav (h-14 mobile, h-16 desktop).
    // Build plan renders full-width below the chat row when present.
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-background">
      {/* Top row: chat + optional library aside */}
      <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
        <div className="flex-1 min-h-0 lg:min-w-0 lg:border-r lg:border-border h-[60vh] lg:h-auto">
          <Sidekick
            fullPage
            onCreateBuildPlan={handleCreateBuildPlan}
            plansRemaining={plansRemaining}
            buildPlanState={buildPlan ? "ready" : isGenerating ? "generating" : "idle"}
            onLibraryItemsChange={handleLibraryItemsChange}
          />
        </div>

        {showLibraryAside && (
          <aside className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 overflow-y-auto border-t lg:border-t-0 border-border bg-muted/20 p-4 lg:p-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">
                Referenced Library Items
              </h3>
              <div className="space-y-2">
                {libraryItems.map((item) => (
                  <LibraryItemPreview key={item.id} {...item} />
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Full-width build plan below the chat */}
      {buildPlan && (
        <section className="w-full border-t border-border bg-muted/20 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <BuildPlanPreview plan={buildPlan} onTitleSaved={handleTitleSaved} />
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
