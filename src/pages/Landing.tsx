import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, BookOpen, Users, ArrowRight, MessageSquare, ExternalLink, Hammer, Calendar } from "lucide-react";
import { ToolGalleryCard } from "@/components/ToolGalleryCard";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GalleryTool {
  id: string;
  name: string;
  summary: string;
  description: string;
  image_url: string | null;
  url: string | null;
}

const Landing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [galleryTools, setGalleryTools] = useState<GalleryTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<GalleryTool | null>(null);

  useEffect(() => {
    if (!user) return;
    navigate("/home", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await (supabase
        .from("tools")
        .select("id, name, summary, description, image_url, url") as any)
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
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-fraunces text-foreground leading-tight mb-6">
              You can build what you need
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Create or remix a tool for your people and place.
            </p>
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


          {/* Gallery Grid */}
          {galleryTools.length > 0 && (
            <div className="mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
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
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all duration-300 aspect-[16/10] min-h-[200px] text-center px-4"
                >
                  <div className="text-4xl mb-2">🌱</div>
                  <p className="font-fraunces font-bold text-foreground group-hover:text-primary transition-colors">
                    And more inside…
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="underline group-hover:text-primary transition-colors">Enter the Studio</span> to browse & remix all tools
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What's Inside */}
      <div className="bg-card/50 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-fraunces font-bold text-foreground text-center mb-12">
            What's Inside the Studio
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sidekick */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      I want to organize a tool library for my block...
                    </div>
                  </div>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-primary/10 rounded-lg px-3 py-2 text-xs text-foreground">
                      Here are two tools from neighbors doing something similar. Want to remix one for your block?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-[10px] font-medium">
                      <Hammer className="h-3 w-3" /> Create a build plan
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Sidekick
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat with an AI partner who knows your neighborhood, surfaces relevant tools and stories from the commons, and helps you shape an idea worth building.
                </p>
              </div>
            </div>

            {/* Build Plan & Peer Support */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Hammer className="h-3.5 w-3.5 text-primary" />
                    <div className="text-[10px] text-muted-foreground font-medium">Your build plan</div>
                  </div>
                  <div className="space-y-1.5 py-1">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted/60 rounded w-full" />
                    <div className="h-2 bg-muted/60 rounded w-5/6" />
                    <div className="flex gap-1.5 mt-2">
                      <div className="h-6 bg-primary/15 rounded px-2 flex items-center">
                        <span className="text-[9px] text-primary font-medium">Copy prompt</span>
                      </div>
                      <div className="h-6 bg-muted rounded px-2 flex items-center">
                        <span className="text-[9px] text-muted-foreground">Talk to a steward</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <div className="inline-flex items-center gap-1 text-[10px] text-primary font-medium">
                      <Users className="h-2.5 w-2.5" /> Shared with Josh from RTP
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-primary" /> Build Plan & Peer Support
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Turn your chat into a clear build plan and get introduced to an RTP steward or a local builder creating something adjacent.
                </p>
              </div>
            </div>


            {/* Library */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  {["Stories", "Tools", "Prompts", "Patterns"].map((label) => (
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
                  A growing commons of stories, tools, prompts, and patterns shared by builders across neighborhoods.
                </p>
              </div>
            </div>

            {/* Events & Network */}
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium text-foreground">Upcoming</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Builder Office Hours", meta: "Thu 6pm" },
                      { label: "Relational Tech Meetup", meta: "Sat 2pm" },
                    ].map((evt) => (
                      <div key={evt.label} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                        <span className="text-[10px] font-medium text-foreground">{evt.label}</span>
                        <span className="text-[9px] text-muted-foreground">{evt.meta}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {["Oakland, CA", "Detroit, MI"].map((place) => (
                      <div key={place} className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/20" />
                        <span className="text-[9px] text-muted-foreground">{place}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-fraunces font-bold text-foreground mb-1 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Events & Network
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join live events, see what other builders are working on, and follow network updates in real time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social signals band */}
      <div className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-fraunces font-bold text-foreground mb-4">
            You're not building alone.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-1">
            Join 300+ builders in diverse neighborhoods across the country.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-7">
            Tap into a commons with hundreds of tools, practices, and stories about relational tech.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-7 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover-scale"
            >
              Enter Your Studio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* At-ease band */}
      <div className="border-t border-border bg-card/40">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <p className="text-muted-foreground leading-relaxed">
            This Studio is free to use and stewarded by the Relational Tech Project, a nonprofit project. The Studio and the tool examples are open-source. We have a roadmap toward community ownership of the tools and the infrastructure we use to build them.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-fraunces font-bold text-foreground text-center mb-10">
            Questions, answered
          </h2>
          <div className="bg-card border border-border rounded-2xl shadow-sm px-2 md:px-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  What is relational tech?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Technology that helps us connect with and care for each other. Small software built by people for a place. Tools we can reuse and remix across our neighborhoods.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  Do I need to know how to code?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  No. You describe what your place needs in plain language, and the Studio's building partner, Sidekick, helps you turn that into a working tool. You can also remix something a neighbor in another place already made. The skills that matter most here aren't technical. They're knowing your neighbors and paying attention to what your place is asking for.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  What can I build?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Whatever your block actually needs. The library is full of starting points: daily neighborhood digests, lending libraries, welcome guides, block-level hubs, directories of local groups and third spaces, walking guides layered with local history. Tools here are small and specific on purpose. One tool, one real need, the people right around you. We think in terms of 1:100, roughly one builder in relationship with a hundred neighbors. Fewer users, more co-creators.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  Is it really free? How is this sustained?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes, free to use. The Studio is stewarded by the Relational Tech Project, a nonprofit project supported by funders who believe neighborhoods should be able to build what they need. There are no ads, no data extraction, and no engagement algorithms. We are not trying to grow your screen time. We are trying to help you spend more time with the people around you.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  Who owns what I build, and what about my neighbors' privacy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  You do. The tools and the software that powers the Studio are open-source, so you can take what you make, host it yourself, fork it, or hand it to someone else. Your neighbors' information stays yours and theirs. We practice data minimalism: collect the least we need, never sell it, and never build surveillance into something meant to bring people together. We also have a roadmap toward community ownership of the tools and the infrastructure we build them on, so this stays a commons rather than a platform.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6" className="border-b-0">
                <AccordionTrigger className="font-fraunces text-lg text-foreground text-left hover:no-underline">
                  Isn't AI the opposite of human connection?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  A lot of it is, and we take that seriously. Our stance is simple: we put AI to work for us, to handle what's tedious about building, so you can spend your time with people instead of screens. Vision, relationship-building, and being present in your community stay fully human. AI never defines what your neighborhood needs or speaks for you. The Studio is built to send you back out to your block, not to keep you here.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <p className="text-center text-muted-foreground mt-8">
            Have another question or idea?{" "}
            <Link to="/contact" className="text-primary hover:underline font-medium">
              Please reach out.
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground/80 mt-6">
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
                {selectedTool.url && (
                  <a
                    href={selectedTool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    See a live example
                  </a>
                )}
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
