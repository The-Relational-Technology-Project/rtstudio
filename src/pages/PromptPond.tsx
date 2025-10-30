import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { PromptCard } from "@/components/PromptCard";
import { Sidekick } from "@/components/Sidekick";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidekick } from "@/contexts/SidekickContext";
const PromptPond = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { messages } = useSidekick();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState<string>("");
  useEffect(() => {
    const loadPrompts = async () => {
      const {
        data
      } = await supabase.from("prompts").select("*").order("created_at", {
        ascending: false
      });
      if (data) setPrompts(data);
    };
    loadPrompts();
  }, []);

  // Scroll to specific prompt if hash is present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && prompts.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [prompts]);
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from("prompts").insert({
        title: newTitle,
        category: newCategory,
        example_prompt: newPrompt
      });
      if (error) throw error;
      toast({
        title: "Prompt added!",
        description: "Your prompt has been shared with the community."
      });
      setNewTitle("");
      setNewCategory("");
      setNewPrompt("");
      setName("");
      setEmail("");
      setIsDialogOpen(false);
      const {
        data
      } = await supabase.from("prompts").select("*").order("created_at", {
        ascending: false
      });
      if (data) setPrompts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-black font-fraunces mb-2">Prompt Pond</h2>
                <p className="text-muted-foreground text-sm">
                  Browse prompts and remix them to build your neighborhood's tools.
                </p>
              </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto shrink-0">Contribute a prompt</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share a prompt</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePromptSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g., Community Survey Generator" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="E.g., Research, Outreach, Analysis" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Example Prompt</Label>
                  <Textarea id="prompt" value={newPrompt} onChange={e => setNewPrompt(e.target.value)} rows={8} placeholder="Write your example prompt here..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name <span className="text-xs text-muted-foreground">(optional but encouraged)</span></Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your email <span className="text-xs text-muted-foreground">(optional but encouraged)</span></Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Sharing..." : "Share Prompt"}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" data-tour="prompts-grid">
              {prompts.length === 0 ? <p className="text-muted-foreground col-span-2">No prompts yet. Be the first to share!</p> : prompts.map(prompt => <div key={prompt.id} id={prompt.id}><PromptCard id={prompt.id} title={prompt.title} category={prompt.category} examplePrompt={prompt.example_prompt} description={prompt.description} exampleUrl={prompt.title === "Hyperlocal Neighbor Hubs" ? "https://cozycorner.place/" : "#"} onRemix={promptText => {
              setRemixPrompt(promptText);
              if (!isMobile) {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }
            }} /></div>)}
            </div>
          </div>
        </main>
        
        {!isMobile && (
          <aside className="hidden lg:block w-96 border-l border-border bg-background">
            <div className="h-full p-4">
              <Sidekick initialPrompt={remixPrompt} onClearInitialPrompt={() => setRemixPrompt("")} />
            </div>
          </aside>
        )}
      </div>
    </div>;
};
export default PromptPond;