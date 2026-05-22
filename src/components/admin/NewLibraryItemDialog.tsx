import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";

type ItemType = "story" | "prompt" | "tool";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}

export const NewLibraryItemDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<ItemType>("story");

  // Shared
  const [title, setTitle] = useState("");
  // Story
  const [storyText, setStoryText] = useState("");
  const [author, setAuthor] = useState("");
  // Prompt
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [examplePrompt, setExamplePrompt] = useState("");
  // Tool
  const [toolDescription, setToolDescription] = useState("");
  const [toolSummary, setToolSummary] = useState("");
  const [url, setUrl] = useState("");
  const [toolCategory, setToolCategory] = useState("relational_tech");
  const [imageUrl, setImageUrl] = useState("");

  const reset = () => {
    setTitle(""); setStoryText(""); setAuthor("");
    setCategory(""); setDescription(""); setExamplePrompt("");
    setToolDescription(""); setToolSummary(""); setUrl("");
    setToolCategory("relational_tech"); setImageUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    let error: any = null;

    if (type === "story") {
      const res = await supabase.from("stories").insert({
        title,
        story_text: storyText.slice(0, 120),
        full_story_text: storyText,
        attribution: author,
        user_id: user?.id ?? null,
      });
      error = res.error;
    } else if (type === "prompt") {
      const res = await supabase.from("prompts").insert({
        title,
        category,
        description,
        example_prompt: examplePrompt,
        user_id: user?.id ?? null,
      });
      error = res.error;
    } else {
      const res = await supabase.from("tools").insert({
        name: title,
        description: toolDescription,
        summary: toolSummary || null,
        url: url || null,
        tool_category: toolCategory,
        image_url: imageUrl || null,
        user_id: user?.id ?? null,
      });
      error = res.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error creating item", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added to library" });
      reset();
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New library item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input id="new-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          {type === "story" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-story">Story</Label>
                <Textarea id="new-story" value={storyText} onChange={e => setStoryText(e.target.value)} rows={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-author">Attribution</Label>
                <Input id="new-author" value={author} onChange={e => setAuthor(e.target.value)} required
                  placeholder="Person, place, context" />
              </div>
            </>
          )}

          {type === "prompt" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-category">Category</Label>
                <Input id="new-category" value={category} onChange={e => setCategory(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Description</Label>
                <Textarea id="new-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-prompt">Example prompt</Label>
                <Textarea id="new-prompt" value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={5} required />
              </div>
            </>
          )}

          {type === "tool" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-tool-desc">Description</Label>
                <Textarea id="new-tool-desc" value={toolDescription} onChange={e => setToolDescription(e.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-tool-summary">Summary (optional, short)</Label>
                <Input id="new-tool-summary" value={toolSummary} onChange={e => setToolSummary(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-url">URL</Label>
                <Input id="new-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-image">Image URL (optional)</Label>
                <Input id="new-image" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={toolCategory} onValueChange={setToolCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relational_tech">Relational tech</SelectItem>
                    <SelectItem value="tech_for_building">Tech for building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              <Plus className="h-3 w-3 mr-1" />
              {saving ? "Adding…" : "Add to library"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
