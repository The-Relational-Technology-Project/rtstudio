import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";
import { HomeSidebar } from "@/components/HomeSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MessageSquare, Calendar, Bell, ChevronLeft, ChevronRight } from "lucide-react";

type MobileTab = "sidekick" | "events" | "updates";

const Home = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MobileTab>("sidekick");

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
              <div className="max-w-6xl mx-auto px-4 py-6">
                <Sidekick fullPage />
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
                <div className="w-[280px] pt-12 py-8 pr-4">
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
