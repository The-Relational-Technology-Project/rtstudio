import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { StoryCard } from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StoryBoard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newStory, setNewStory] = useState("");
  const [attribution, setAttribution] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const access = localStorage.getItem("studio_access");
    if (access !== "granted") {
      navigate("/auth");
      return;
    }

    const loadStories = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setStories(data);
    };

    loadStories();
  }, [navigate]);

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          title: newTitle,
          story_text: newStory,
          attribution,
        });

      if (error) throw error;

      toast({
        title: "Story added!",
        description: "Your spark has been shared with the community.",
      });

      setNewTitle("");
      setNewStory("");
      setAttribution("");
      setName("");
      setEmail("");
      setIsDialogOpen(false);

      const { data } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setStories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add story. Please try again.",
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
            <h2 className="text-4xl font-black font-fraunces mb-2">Story Board</h2>
            <p className="text-muted-foreground">
              See what's possible. Neighborhood sparks shared by members of the studio.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Add your story</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share your story</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStorySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Give your story a title..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="story">Your story (2-3 sentences)</Label>
                  <Textarea
                    id="story"
                    value={newStory}
                    onChange={(e) => setNewStory(e.target.value)}
                    rows={4}
                    placeholder="Share what's happening—or could happen—with relational tech..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attribution">Attribution</Label>
                  <Input
                    id="attribution"
                    value={attribution}
                    onChange={(e) => setAttribution(e.target.value)}
                    placeholder="Your first name or 'Anonymous'"
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
                  {isSubmitting ? "Sharing..." : "Share Story"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.length === 0 ? (
            <p className="text-muted-foreground col-span-2">No stories yet. Be the first to share!</p>
          ) : (
            stories.map((story) => (
              <StoryCard
                key={story.id}
                id={story.id}
                title={story.title || "Untitled"}
                story={story.story_text}
                attribution={story.attribution}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default StoryBoard;
