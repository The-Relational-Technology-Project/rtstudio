import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ToolsForCrafting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tools, setTools] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const sessionToken = localStorage.getItem("studio_session");
      if (!sessionToken) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-session', {
          body: { token: sessionToken }
        });

        if (error || !data?.valid) {
          localStorage.removeItem("studio_session");
          navigate("/auth");
          return;
        }

        const { data: toolsData } = await supabase
          .from("tools")
          .select("*")
          .order("created_at", { ascending: true });
        
        if (toolsData) setTools(toolsData);
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem("studio_session");
        navigate("/auth");
      }
    };

    verifyAccess();
  }, [navigate]);

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("tools")
        .insert({
          name: newName,
          description: newDescription,
          url: newUrl,
        });

      if (error) throw error;

      toast({
        title: "Tool added!",
        description: "Your tool suggestion has been shared with the community.",
      });

      setNewName("");
      setNewDescription("");
      setNewUrl("");
      setName("");
      setEmail("");
      setIsDialogOpen(false);

      const { data } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (data) setTools(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-black font-fraunces mb-3 sm:mb-2">Tools for Crafting</h2>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              Use the tools. Share your tricks. Join a play group.
            </p>
            <p className="text-xs sm:text-sm italic text-muted-foreground leading-relaxed">
              Every tool is better when shared. Add your tips, and join play groups when a handful of builders are ready.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto shrink-0">Suggest a Tool</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Suggest a Tool</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleToolSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="toolName">Tool Name</Label>
                  <Input
                    id="toolName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="E.g., Figma"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of the tool..."
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name <span className="text-xs text-muted-foreground">(optional but encouraged)</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your email <span className="text-xs text-muted-foreground">(optional but encouraged)</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Adding..." : "Suggest Tool"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ToolsForCrafting;
