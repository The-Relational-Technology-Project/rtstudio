import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { PromptCard } from "@/components/PromptCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PromptPond = () => {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadPrompts = async () => {
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setPrompts(data);
    };

    loadPrompts();
  }, []);

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("prompts")
        .insert({
          title: newTitle,
          category: newCategory,
          example_prompt: newPrompt,
        });

      if (error) throw error;

      toast({
        title: "Prompt added!",
        description: "Your prompt has been shared with the community.",
      });

      setNewTitle("");
      setNewCategory("");
      setNewPrompt("");
      setIsDialogOpen(false);

      const { data } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setPrompts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-black font-fraunces mb-2">Prompt Pond</h2>
            <p className="text-muted-foreground">
              A collection of prompts to help you build with AI. Dip in and remix freely to make these your own.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Add a prompt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share a prompt</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePromptSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g., Community Survey Generator"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="E.g., Research, Outreach, Analysis"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Example Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    rows={8}
                    placeholder="Write your example prompt here..."
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Sharing..." : "Share Prompt"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prompts.length === 0 ? (
            <p className="text-muted-foreground col-span-2">No prompts yet. Be the first to share!</p>
          ) : (
            prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                title={prompt.title}
                category={prompt.category}
                examplePrompt={prompt.example_prompt}
                description={prompt.description}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default PromptPond;
