import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, BookOpen, Users, ArrowRight, MessageSquare } from "lucide-react";
import { ToolGalleryCard } from "@/components/ToolGalleryCard";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryTool {
  id: string;
  name: string;
  summary: string;
  description: string;
  image_url: string | null;
}

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [galleryTools, setGalleryTools] = useState<GalleryTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<GalleryTool | null>(null);

  useEffect(() => {
    if (user) {
      const hasProfileContent = profile && (
        profile.display_name || profile.neighborhood || profile.neighborhood_description || profile.dreams
      );
      if (!hasProfileContent) {
        navigate("/profile", { replace: true });
      } else {
        navigate("/sidekick", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await (supabase
        .from("tools")
        .select("id, name, summary, description, image_url") as any)
        .eq("tool_category", "relational_tech")
        .not("image_url", "is", null)
        .order("sort_order", { ascending: true });
      if (data) setGalleryTools(data);
    };
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-fraunces text-foreground mb-6 leading-tight">
              You can build what you need
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Craft relational tech for your people and place
            </p>
          </div>

          {/* Gallery Grid */}
          {galleryTools.length > 0 && (
            <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-2xl font-fraunces font-bold text-foreground text-center mb-2">
                Remixable Tools
              </h2>
              <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">
                Browse tools built by neighbors. Enter the Studio to remix any of them for your community.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryTools.map((tool) => (
                  <ToolGalleryCard
                    key={tool.id}
                    name={tool.name}
                    summary={tool.summary || ""}
                    imageUrl={tool.image_url}
                    onClick={() => setSelectedTool(tool)}
                  />
                ))}
                {/* "More tools" teaser card */}
                <Link
                  to="/auth"
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all duration-300 aspect-[16/10] min-h-[200px]"
                >
                  <div className="text-4xl mb-2">🌱</div>
                  <p className="font-fraunces font-bold text-foreground group-hover:text-primary transition-colors">
                    And more inside…
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the Studio to browse & remix all tools
                  </p>
                </Link>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mb-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
              >
                Enter Your Studio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* What's Inside */}
      <div className="bg-card/50 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-fraunces font-bold text-foreground text-center mb-12">
            What's Inside the Studio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidekick */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      I want to organize a block party for my street...
                    </div>
                  </div>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-primary/10 rounded-lg px-3 py-2 text-xs text-foreground">
                      Great idea! Let's start with a date and invite list. I can help you create a flyer too.
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Sidekick
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat to explore ideas, remix tools, and move into action locally.
                </p>
              </div>
            </div>

            {/* Library */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  {["Stories", "Tools", "Prompts", "Tech"].map((label) => (
                    <div key={label} className="bg-muted rounded-lg px-3 py-3 text-center">
                      <div className="text-xs font-medium text-foreground">{label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">from neighbors</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Library
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stories, tools, and prompts shared by people building with neighbors.
                </p>
              </div>
            </div>

            {/* Peer Network */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="space-y-2">
                  {["Oakland, CA", "Detroit, MI", "Brooklyn, NY"].map((place) => (
                    <div key={place} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20" />
                      <div>
                        <div className="text-xs font-medium text-foreground">{place}</div>
                        <div className="text-[10px] text-muted-foreground">Building locally</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Peer Network
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join fellow builders crafting relational technology for their neighborhoods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What is Relational Tech? */}
      <div className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-fraunces font-bold text-foreground mb-4">
            What is Relational Tech?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Technology that helps us reconnect and care for each other. Small software built by people for a place. Tools we can reuse and remix across our neighborhoods.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Part of the{" "}
            <a href="https://relationaltechproject.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Relational Tech Project
            </a>
          </p>
        </div>
      </div>

      <Footer />

      {/* Tool detail dialog */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTool && (
            <div className="space-y-6">
              {selectedTool.image_url && (
                <img
                  src={selectedTool.image_url}
                  alt={selectedTool.name}
                  className="w-full rounded-xl border border-border"
                />
              )}
              <div>
                <h2 className="text-2xl font-fraunces font-bold text-foreground mb-2">
                  {selectedTool.name}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>
              <Link to="/auth" className="block">
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-xl"
                >
                  Remix This in Studio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
