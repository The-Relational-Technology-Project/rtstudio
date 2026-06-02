import { useState } from "react";
import { Link } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Calendar, Gift, Sparkles, CheckCircle, Terminal, GitFork, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Support = () => {
  const { toast } = useToast();
  const [giftForm, setGiftForm] = useState({
    name: "",
    email: "",
    neighborhood: "",
    idea: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftForm.name.trim() || !giftForm.idea.trim()) {
      toast({ title: "Please fill in your name and idea description.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-gift-build", {
        body: {
          builder_name: giftForm.name.trim(),
          builder_email: giftForm.email.trim() || undefined,
          neighborhood: giftForm.neighborhood.trim() || undefined,
          idea_title: giftForm.idea.trim().slice(0, 100),
          idea_summary: giftForm.idea.trim(),
          source: "support_page",
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error) {
      console.error("Gift build submit error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or reach out directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold font-fraunces mb-3">Resources</h1>
        <p className="text-muted-foreground mb-12">
          Resources and guidance for builders working at the intersection of technology and community.
        </p>

        {/* Builder's Guide */}
        <section className="mb-10 p-6 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-xl font-semibold font-fraunces mb-3">The Builder's Guide</h2>
          <p className="text-sm text-foreground mb-4">
            The Builder's Guide includes practical ideas for how to go about building relational tech.
            Informed by our experiences building in our neighborhoods, it describes a "spiral" of
            widening and deepening circles.
          </p>
          <Button asChild>
            <a href="/Builders_Guide_RTP.pdf" download>
              <Download className="mr-2 h-4 w-4" />
              Download the Builder's Guide
            </a>
          </Button>
        </section>

        {/* Request a Gift Build */}
        <section className="mb-10 p-6 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold font-fraunces">Request a Gift Build</h2>
          </div>

          {isSubmitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-2">
                    Your Gift Build request has been sent!
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Josh will review your idea and prepare for your session. Book a time at least a week
                    out so he can come ready to build with you.
                  </p>
                </div>
              </div>
              <Button asChild>
                <a href="https://cal.com/joshnesbit/" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Your Jam Session
                </a>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-2">
                Have an idea for a neighborhood tool? Josh from the RTP team will walk you through
                an initial build and help you get set up with the right tools — completely free.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                We recommend booking your session at least a week out so Josh can review your idea
                beforehand.
              </p>
              <div className="flex items-center gap-2 mb-5 p-3 rounded-md bg-background border border-border">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Not sure where to start?{" "}
                  <Link to="/sidekick" className="text-primary hover:underline font-medium">
                    Chat with Sidekick
                  </Link>{" "}
                  to develop your idea first.
                </p>
              </div>

              <form onSubmit={handleGiftSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gift-name" className="text-sm font-medium mb-1 block">
                    Your name *
                  </label>
                  <Input
                    id="gift-name"
                    value={giftForm.name}
                    onChange={(e) => setGiftForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="gift-email" className="text-sm font-medium mb-1 block">
                    Email
                  </label>
                  <Input
                    id="gift-email"
                    type="email"
                    value={giftForm.email}
                    onChange={(e) => setGiftForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="So Josh can follow up"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label htmlFor="gift-neighborhood" className="text-sm font-medium mb-1 block">
                    Neighborhood
                  </label>
                  <Input
                    id="gift-neighborhood"
                    value={giftForm.neighborhood}
                    onChange={(e) => setGiftForm((f) => ({ ...f, neighborhood: e.target.value }))}
                    placeholder="Where are you building?"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="gift-idea" className="text-sm font-medium mb-1 block">
                    Describe your idea *
                  </label>
                  <Textarea
                    id="gift-idea"
                    value={giftForm.idea}
                    onChange={(e) => setGiftForm((f) => ({ ...f, idea: e.target.value }))}
                    placeholder="What do you want to build for your neighborhood? Who is it for? What problem does it solve?"
                    className="min-h-[120px]"
                    maxLength={5000}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <Gift className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Submit Gift Build Request"}
                </Button>
              </form>
            </>
          )}
        </section>

        {/* 1:1 Jam Session */}
        <section className="mb-10 p-6 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-xl font-semibold font-fraunces mb-3">1:1 Jam Session</h2>
          <p className="text-sm text-foreground mb-4">
            Josh, one of the stewards of the Relational Tech Project, is available for 1:1
            conversations about building and remixing relational tech. These sessions range from
            just getting started, to the details of design and implementation, to co-creation.
          </p>
          <Button asChild>
            <a href="https://cal.com/joshnesbit/" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Jam Session
            </a>
          </Button>
        </section>

        {/* Developer Resources */}
        <div className="border-t border-border pt-10 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold font-fraunces">Developer Resources</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            For builders who want to connect their own AI tools, query the commons directly, or contribute to the open-source codebase.
          </p>

          {/* Connect Your Tools */}
          <section className="mb-8 p-6 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold font-fraunces mb-3">Connect Your AI Tool</h3>
            <p className="text-sm text-foreground mb-3">
              The RT MCP Server gives Claude Code, Cursor, Claude Desktop, and any MCP-compatible tool live access to the RTP global commons — neighborhood recipes, frameworks, methodology, and field references — through one URL. No API key, no signup.
            </p>
            <div className="flex flex-wrap gap-2 mb-5 text-xs">
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">275+ items</span>
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">8 methodology</span>
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">7 frameworks</span>
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">63 recipes</span>
              <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">197 references</span>
            </div>
            <div className="mb-4 p-4 rounded-md bg-background border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Add to your MCP settings:</p>
              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre font-mono leading-relaxed">{`{
  "mcpServers": {
    "relational-tech": {
      "type": "streamable-http",
      "url": "https://mcp.relationaltechproject.org/mcp"
    }
  }
}`}</pre>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Once connected, invoke the <code className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">practice-guide</code> prompt to adopt the Neighboring Commons stance for the rest of your conversation — relationships-first, asset-based, citing practitioners by name.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="https://mcp.relationaltechproject.org/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  MCP Server Docs
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/The-Relational-Technology-Project/rt-mcp-server" target="_blank" rel="noopener noreferrer">
                  <GitFork className="mr-2 h-3.5 w-3.5" />
                  Self-Host the Server
                </a>
              </Button>
            </div>
          </section>

          {/* How It Fits Together */}
          <section className="mb-8 p-6 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-xl font-semibold font-fraunces mb-3">How It Fits Together</h3>
            <p className="text-sm text-foreground mb-5">
              The Studio is one surface for a broader open-source ecosystem built around a shared commons. Here's how the pieces connect:
            </p>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">The Commons</p>
                  <p className="text-muted-foreground">A single shared library — 275+ canonical items spanning RTP methodology, frameworks, actionable neighborhood recipes (block parties, mutual aid, repair cafes, restorative circles, and more), and field references to practitioners' work. Hosted on the RTP main site Supabase, queryable by any Studio or AI tool.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">The Studio (this app)</p>
                  <p className="text-muted-foreground">Where builders explore the local library, remix tools with Sidekick, and develop ideas for their neighborhood. Sidekick draws on both this Studio's library and the broader commons — local items show up as cards, commons references appear inline with attribution.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">The MCP Server</p>
                  <p className="text-muted-foreground">The same commons, exposed to any MCP-compatible AI tool. Built around five tools, five prompts (including the practice-guide stance), and nine methodology resources at stable URIs. Connect Claude Code or Cursor and you have the same knowledge Sidekick draws from.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">The Network Feed</p>
                  <p className="text-muted-foreground">A live feed of what's shipping across the network, powered by the Watcher system that monitors open-source relational tech repos tagged <code className="text-xs px-1 rounded bg-background">relational-tech</code> on GitHub.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Explore and Contribute */}
          <section className="p-6 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <GitFork className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold font-fraunces">Explore and Contribute</h3>
            </div>
            <p className="text-sm text-foreground mb-4">
              The Studio, the MCP server, and the commons schema are all open source. Browse the code, open issues, or contribute back — bug fixes, new features, schema improvements, additional recipes. The commons grows when builders share what they've learned.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="https://github.com/The-Relational-Technology-Project/rtstudio" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Studio on GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/The-Relational-Technology-Project/rt-mcp-server" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  MCP Server on GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/The-Relational-Technology-Project/rtp-main-site" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Commons + Main Site
                </a>
              </Button>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
