import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";
import { HomeSidebar } from "@/components/HomeSidebar";
import { PrototypePreview } from "@/components/PrototypePreview";
import { PromptReviewModal } from "@/components/PromptReviewModal";
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

  const handleBuildIt = (summaryPrompt: string) => {
    setPendingPrompt(summaryPrompt);
    setShowPromptReview(true);
  };

  const generatePrototype = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke("generate-prototype", {
        body: { prompt },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPrototype({
        code: data.code,
        prompt,
        prototypeId: data.prototypeId,
        shareId: data.shareId,
      });
      setBuildsRemaining(data.remaining);
      setShowPromptReview(false);

      // Inject post-build message into Sidekick chat
      setMessages((prev) => [...prev, {
        role: "assistant" as const,
        content: "You'll see your demo prototype below! Share this with neighbors or collaborators to get their feedback. Then bring the prompt into an AI builder to build a fully-functional tool."
      }]);
    } catch (error) {
      console.error("Prototype generation error:", error);
      toast({
        title: "Build failed",
        description: error instanceof Error ? error.message : "Something went wrong. Try again or simplify your prompt.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmBuild = async (editedPrompt: string) => {
    await generatePrototype(editedPrompt);
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
                <Sidekick fullPage onBuildIt={handleBuildIt} buildsRemaining={buildsRemaining} />
                {prototype && (
                  <PrototypePreview {...prototype} />
                )}
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
              <Sidekick fullPage onBuildIt={handleBuildIt} buildsRemaining={buildsRemaining} />
              {prototype && (
                <PrototypePreview {...prototype} />
              )}
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
