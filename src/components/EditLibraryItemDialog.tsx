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
    } else if (item.type === "tool") {
      const res = await supabase.from("tools").update({
        name: title,
        description: toolDescription,
        url,
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
            Edit {item.type === "tool" ? "Tool" : item.type === "prompt" ? "Prompt" : "Story"}
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

          {item.type === "tool" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-tool-desc">Description</Label>
                <Textarea id="edit-tool-desc" value={toolDescription} onChange={e => setToolDescription(e.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input id="edit-url" type="url" value={url} onChange={e => setUrl(e.target.value)} required />
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
