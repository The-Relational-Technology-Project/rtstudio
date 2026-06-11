import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Pencil, Check } from "lucide-react";
import type { LibraryItem } from "@/types/library";

interface EditLibraryItemDialogProps {
  item: LibraryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditLibraryItemDialog = ({ item, open, onOpenChange, onSuccess }: EditLibraryItemDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Shared
  const [title, setTitle] = useState(item.title);
  // Story
  const [storyText, setStoryText] = useState(item.fullContent || item.summary || "");
  const [author, setAuthor] = useState(item.author || "");
  // Prompt
  const [category, setCategory] = useState(item.category || "");
  const [description, setDescription] = useState(item.summary === "No description" ? "" : item.summary);
  const [examplePrompt, setExamplePrompt] = useState(item.examplePrompt || "");
  // Tool
  const [toolDescription, setToolDescription] = useState(item.summary);
  const [url, setUrl] = useState(item.url || "");
  const [githubUrl, setGithubUrl] = useState(item.githubUrl || "");
  const [lovableUrl, setLovableUrl] = useState(item.lovableUrl || "");
  const [hostedUrl, setHostedUrl] = useState(item.hostedUrl || "");
  const [hostedBy, setHostedBy] = useState(item.hostedBy || "");
  const [creatorName, setCreatorName] = useState(item.creatorName || "");
  const [creatorUrl, setCreatorUrl] = useState(item.creatorUrl || "");
  const [lineageNote, setLineageNote] = useState(item.lineageNote || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let error: any = null;

    if (item.type === "story") {
      const res = await supabase.from("stories").update({
        title,
        story_text: storyText.slice(0, 120),
        full_story_text: storyText,
        attribution: author,
      }).eq("id", item.id);
      error = res.error;
    } else if (item.type === "prompt") {
      const res = await supabase.from("prompts").update({
        title,
        category,
        description,
        example_prompt: examplePrompt,
      }).eq("id", item.id);
      error = res.error;
    } else if (item.type === "tool" || item.type === "tech_for_building") {
      const res = await supabase.from("tools").update({
        name: title,
        description: toolDescription,
        url,
        github_url: githubUrl || null,
        lovable_url: lovableUrl || null,
        hosted_url: hostedUrl || null,
        hosted_by: hostedBy || null,
        creator_name: creatorName || null,
        creator_url: creatorUrl || null,
        lineage_note: lineageNote || null,
      }).eq("id", item.id);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your item has been updated." });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit {item.type === "tool" || item.type === "tech_for_building" ? "Tool" : item.type === "prompt" ? "Prompt" : "Story"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          {item.type === "story" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-story">Story</Label>
                <Textarea id="edit-story" value={storyText} onChange={e => setStoryText(e.target.value)} rows={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">Attribution</Label>
                <Input id="edit-author" value={author} onChange={e => setAuthor(e.target.value)} required />
              </div>
            </>
          )}

          {item.type === "prompt" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input id="edit-category" value={category} onChange={e => setCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prompt">Example Prompt</Label>
                <Textarea id="edit-prompt" value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={5} required />
              </div>
            </>
          )}

          {(item.type === "tool" || item.type === "tech_for_building") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-tool-desc">Description</Label>
                <Textarea id="edit-tool-desc" value={toolDescription} onChange={e => setToolDescription(e.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input id="edit-url" type="url" value={url} onChange={e => setUrl(e.target.value)} required />
              </div>

              <p className="text-xs font-medium text-muted-foreground pt-2">Deployment options — shown on the card and used in build plans</p>
              <div className="space-y-2">
                <Label htmlFor="edit-github">GitHub repo URL (enables the fork option)</Label>
                <Input id="edit-github" type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lovable">Lovable project URL (optional)</Label>
                <Input id="edit-lovable" type="url" value={lovableUrl} onChange={e => setLovableUrl(e.target.value)} placeholder="https://lovable.dev/projects/…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hosted-url">Hosted version URL (if someone offers one)</Label>
                <Input id="edit-hosted-url" type="url" value={hostedUrl} onChange={e => setHostedUrl(e.target.value)} placeholder="https://communitysupplies.org" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hosted-by">Hosted by</Label>
                <Input id="edit-hosted-by" value={hostedBy} onChange={e => setHostedBy(e.target.value)} placeholder="Who runs the hosted version" />
              </div>

              <p className="text-xs font-medium text-muted-foreground pt-2">Lineage — attribution that travels with remixes</p>
              <div className="space-y-2">
                <Label htmlFor="edit-creator">Creator</Label>
                <Input id="edit-creator" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="Person or group who made this" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-creator-url">Creator link (optional)</Label>
                <Input id="edit-creator-url" type="url" value={creatorUrl} onChange={e => setCreatorUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lineage">Lineage note</Label>
                <Textarea id="edit-lineage" value={lineageNote} onChange={e => setLineageNote(e.target.value)} rows={2} placeholder="e.g. Adapted from BuildIRL with permission; remixed for the Outer Sunset." />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              <Check className="h-3 w-3 mr-1" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
