import { Button } from "@/components/ui/button";
import { Terminal, ExternalLink, GitFork } from "lucide-react";

export const DeveloperResources = () => {
  return (
    <section>
      <h2 className="text-2xl font-fraunces font-bold text-foreground mb-2 flex items-center gap-2">
        <Terminal className="h-5 w-5 text-primary" />
        Developer Resources
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        For builders who want to connect their own AI tools, query the commons directly, or
        contribute to the open-source codebase.
      </p>

      {/* Connect Your Tools */}
      <section className="mb-8 p-6 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-xl font-semibold font-fraunces mb-3">Connect Your AI Tool</h3>
        <p className="text-sm text-foreground mb-3">
          The RT MCP Server gives Claude Code, Cursor, Claude Desktop, and any MCP-compatible
          tool live access to the RTP global commons — neighborhood recipes, frameworks,
          methodology, and field references — through one URL. No API key, no signup.
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
    </section>
  );
};
