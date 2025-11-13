import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Sparkles, Wrench, BookOpen } from "lucide-react";

type ContributionType = "story" | "prompt" | "tool" | null;

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ContributionDialog = ({ open, onOpenChange, onSuccess }: ContributionDialogProps) => {
  const [contributionType, setContributionType] = useState<ContributionType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Story fields
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyAttribution, setStoryAttribution] = useState("");

  // Prompt fields
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [promptExample, setPromptExample] = useState("");
  const [promptCategory, setPromptCategory] = useState("");

  // Tool fields
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolUrl, setToolUrl] = useState("");

  const resetForm = () => {
    setContributionType(null);
    setStoryTitle("");
    setStoryText("");
    setStoryAttribution("");
    setPromptTitle("");
    setPromptDescription("");
    setPromptExample("");
    setPromptCategory("");
    setToolName("");
    setToolDescription("");
    setToolUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (contributionType === "story") {
        const { error } = await supabase.from("stories").insert({
          title: storyTitle,
          story_text: storyText,
          attribution: storyAttribution,
        });
        if (error) throw error;
        toast({ title: "Story shared!", description: "Your story has been added to the library." });
      } else if (contributionType === "prompt") {
        const { error } = await supabase.from("prompts").insert({
          title: promptTitle,
          description: promptDescription,
          example_prompt: promptExample,
          category: promptCategory,
        });
        if (error) throw error;
        toast({ title: "Prompt submitted!", description: "Your prompt has been added to the library." });
      } else if (contributionType === "tool") {
        const { error } = await supabase.from("tools").insert({
          name: toolName,
          description: toolDescription,
          url: toolUrl,
        });
        if (error) throw error;
        toast({ title: "Tool suggested!", description: "Your tool has been added to the library." });
      }

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Contribution error:", error);
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Contribute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {!contributionType ? (
          <>
            <DialogHeader>
              <DialogTitle>What would you like to contribute?</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-2"
                onClick={() => setContributionType("story")}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">Share a Story</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Tell us about relational tech in your neighborhood
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-2"
                onClick={() => setContributionType("prompt")}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">Submit a Prompt</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Share a prompt template for community building
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-2"
                onClick={() => setContributionType("tool")}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  <span className="font-semibold">Suggest a Tool</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Recommend a tool that helps build community
                </span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {contributionType === "story" && "Share Your Story"}
                {contributionType === "prompt" && "Submit a Prompt"}
                {contributionType === "tool" && "Suggest a Tool"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {contributionType === "story" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storyTitle">Title</Label>
                    <Input
                      id="storyTitle"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="Give your story a title..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyText">Your Story</Label>
                    <Textarea
                      id="storyText"
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      rows={5}
                      placeholder="Share what's happening in your neighborhood..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storyAttribution">Attribution</Label>
                    <Input
                      id="storyAttribution"
                      value={storyAttribution}
                      onChange={(e) => setStoryAttribution(e.target.value)}
                      placeholder="Your name or 'Anonymous'"
                      required
                    />
                  </div>
                </>
              )}

              {contributionType === "prompt" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="promptTitle">Title</Label>
                    <Input
                      id="promptTitle"
                      value={promptTitle}
                      onChange={(e) => setPromptTitle(e.target.value)}
                      placeholder="Name your prompt..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promptCategory">Category</Label>
                    <Input
                      id="promptCategory"
                      value={promptCategory}
                      onChange={(e) => setPromptCategory(e.target.value)}
                      placeholder="e.g., Gathering, Communication, Planning"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promptDescription">Description</Label>
                    <Textarea
                      id="promptDescription"
                      value={promptDescription}
                      onChange={(e) => setPromptDescription(e.target.value)}
                      rows={3}
                      placeholder="Briefly describe what this prompt helps with..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promptExample">Example Prompt</Label>
                    <Textarea
                      id="promptExample"
                      value={promptExample}
                      onChange={(e) => setPromptExample(e.target.value)}
                      rows={5}
                      placeholder="Paste your full prompt here..."
                      required
                    />
                  </div>
                </>
              )}

              {contributionType === "tool" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="toolName">Tool Name</Label>
                    <Input
                      id="toolName"
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      placeholder="Name of the tool..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toolDescription">Description</Label>
                    <Textarea
                      id="toolDescription"
                      value={toolDescription}
                      onChange={(e) => setToolDescription(e.target.value)}
                      rows={4}
                      placeholder="What does this tool do? How can it help?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toolUrl">URL</Label>
                    <Input
                      id="toolUrl"
                      type="url"
                      value={toolUrl}
                      onChange={(e) => setToolUrl(e.target.value)}
                      placeholder="https://..."
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setContributionType(null)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
