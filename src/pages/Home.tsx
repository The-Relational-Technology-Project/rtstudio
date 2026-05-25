import { useRef, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";
import { HomeSidebar } from "@/components/HomeSidebar";
import { PrototypePreview } from "@/components/PrototypePreview";
import { PromptReviewModal, type ReferenceImage } from "@/components/PromptReviewModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSidekick } from "@/contexts/SidekickContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MessageSquare, Calendar, Bell, ChevronLeft, ChevronRight } from "lucide-react";

interface PrototypeData {
  code: string;
  prompt: string;
  prototypeId: string;
  shareId: string;
  toolName?: string;
}

type MobileTab = "sidekick" | "events" | "updates";

const Home = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { setMessages } = useSidekick();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MobileTab>("sidekick");

  // Prototype builder state
  const [prototype, setPrototype] = useState<PrototypeData | null>(null);
  const [showPromptReview, setShowPromptReview] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildsRemaining, setBuildsRemaining] = useState(10);
  const buildAbortRef = useRef<AbortController | null>(null);

  const handleBuildIt = (summaryPrompt: string) => {
    setPendingPrompt(summaryPrompt);
    setShowPromptReview(true);
  };

  // If the edge function call hangs or drops, the prototype row may still have
  // been written. Look it up directly so we don't tell the user the build failed
  // when it actually succeeded.
  const findRecentPrototype = async (prompt: string, sinceISO: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from("prototypes")
      .select("id, share_id, generated_code, prompt, created_at")
      .eq("builder_id", user.id)
      .eq("prompt", prompt)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Recovery lookup error:", error);
      return null;
    }
    return data;
  };

  const generatePrototype = async (prompt: string, referenceImages: ReferenceImage[] = []) => {
    setIsGenerating(true);
    const startedAt = new Date().toISOString();
    const controller = new AbortController();
    buildAbortRef.current = controller;
    // 4-minute client-side ceiling.
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 4 * 60 * 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Call the edge function via raw fetch so we can attach AbortSignal.
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/generate-prototype`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ prompt, referenceImages }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Build failed (${res.status})`);
      }

      setPrototype({
        code: data.code,
        prompt,
        prototypeId: data.prototypeId,
        shareId: data.shareId,
      });
      if (typeof data.remaining === "number") setBuildsRemaining(data.remaining);
      setShowPromptReview(false);

      // Inject post-build message into Sidekick chat
      setMessages((prev) => [...prev, {
        role: "assistant" as const,
        content: "You'll see your demo prototype below! Share this with neighbors or collaborators to get their feedback. Then bring the prompt into an AI builder to build a fully-functional tool."
      }]);
    } catch (error) {
      console.error("Prototype generation error:", error);
      const aborted = (error as any)?.name === "AbortError" || controller.signal.aborted;

      // Recovery: the build may have completed server-side even if the response
      // never made it back to us. Check the DB before declaring failure.
      const recovered = await findRecentPrototype(prompt, startedAt);
      if (recovered) {
        setPrototype({
          code: recovered.generated_code,
          prompt: recovered.prompt,
          prototypeId: recovered.id,
          shareId: recovered.share_id,
        });
        setShowPromptReview(false);
        setMessages((prev) => [...prev, {
          role: "assistant" as const,
          content: "Your prototype finished building — it's below. (The connection dropped on the way back, but the build itself made it through.)"
        }]);
      } else if (aborted) {
        toast({
          title: "Build is taking longer than expected",
          description: "It may still be running. Wait a minute and refresh — your build will appear if it finished. Otherwise, try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Build failed",
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

  const handleCancelBuild = () => {
    buildAbortRef.current?.abort("user-cancel");
  };

  const handleConfirmBuild = async (editedPrompt: string, referenceImages: ReferenceImage[]) => {
    await generatePrototype(editedPrompt, referenceImages);
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
                <Sidekick fullPage onBuildIt={handleBuildIt} buildsRemaining={buildsRemaining} prototypeSlot={prototype ? <PrototypePreview {...prototype} /> : null} />
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
              <Sidekick fullPage onBuildIt={handleBuildIt} buildsRemaining={buildsRemaining} prototypeSlot={prototype ? <PrototypePreview {...prototype} /> : null} />
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

      <PromptReviewModal
        open={showPromptReview}
        onOpenChange={setShowPromptReview}
        prompt={pendingPrompt}
        remaining={buildsRemaining}
        onConfirm={handleConfirmBuild}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default Home;
