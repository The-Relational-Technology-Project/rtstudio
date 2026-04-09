import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";
import { HomeSidebar } from "@/components/HomeSidebar";
import { PrototypePreview } from "@/components/PrototypePreview";
import { PromptReviewModal } from "@/components/PromptReviewModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
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
  remaining: number;
}

type MobileTab = "sidekick" | "events" | "updates";

const Home = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MobileTab>("sidekick");

  // Prototype builder state
  const [prototype, setPrototype] = useState<PrototypeData | null>(null);
  const [showPromptReview, setShowPromptReview] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [buildsRemaining, setBuildsRemaining] = useState(10);

  const handleBuildIt = (summaryPrompt: string) => {
    setPendingPrompt(summaryPrompt);
    setShowPromptReview(true);
  };

  const generatePrototype = async (prompt: string, refinementOf?: string, currentCode?: string) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prototype`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt,
            refinementOf,
            currentCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prototype");
      }

      setPrototype({
        code: data.code,
        prompt,
        prototypeId: data.prototypeId,
        shareId: data.shareId,
        remaining: data.remaining,
      });
      setBuildsRemaining(data.remaining);
      setShowPromptReview(false);
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

  const handleRefine = async (refinement: string) => {
    if (!prototype) return;
    setIsRefining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prototype`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt: refinement,
            refinementOf: prototype.prototypeId,
            currentCode: prototype.code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refine prototype");
      }

      setPrototype({
        code: data.code,
        prompt: refinement,
        prototypeId: data.prototypeId,
        shareId: data.shareId,
        remaining: data.remaining,
      });
      setBuildsRemaining(data.remaining);
    } catch (error) {
      console.error("Refine error:", error);
      toast({
        title: "Refine failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
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
                {prototype && (
                  <PrototypePreview
                    {...prototype}
                    onRefine={handleRefine}
                    isRefining={isRefining}
                  />
                )}
                <Sidekick fullPage onBuildIt={handleBuildIt} buildsRemaining={buildsRemaining} />
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
            <div className="flex-1 min-w-0 px-4 py-8">
              <Sidekick fullPage />
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
