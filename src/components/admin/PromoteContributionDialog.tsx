import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Contribution = {
  id: string;
  title: string;
  description: string;
  links: string[];
  contributor_name: string;
  user_id: string;
};

type TargetType = "story" | "prompt" | "tool";

interface Props {
  contribution: Contribution;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}

export const PromoteContributionDialog = ({ contribution, open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [targetType, setTargetType] = useState<TargetType>("story");
  const [title, setTitle] = useState(contribution.title);
  const [description, setDescription] = useState(contribution.description);
  const [author, setAuthor] = useState(contribution.contributor_name);
  const [category, setCategory] = useState("");
  const [examplePrompt, setExamplePrompt] = useState("");
  const [url, setUrl] = useState(contribution.links?.[0] || "");
  const [saving, setSaving] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let promotedId: string | null = null;
    let error: any = null;

    if (targetType === "story") {
      const { data, error: e } = await supabase.from("stories").insert({
        title, story_text: description.slice(0, 120), full_story_text: description,
        attribution: author, user_id: contribution.user_id,
      }).select("id").single();
      promotedId = data?.id || null; error = e;
    } else if (targetType === "prompt") {
      const { data, error: e } = await supabase.from("prompts").insert({
        title, category: category || "general", description,
        example_prompt: examplePrompt || description, user_id: contribution.user_id,
      }).select("id").single();
      promotedId = data?.id || null; error = e;
    } else {
      const { data, error: e } = await supabase.from("tools").insert({
        name: title, description, url: url || null, user_id: contribution.user_id,
      }).select("id").single();
      promotedId = data?.id || null; error = e;
    }

    if (error || !promotedId) {
      toast({ title: "Promote failed", description: error?.message || "Unknown error", variant: "destructive" });
      setSaving(false);
      return;
    }

    await supabase.from("contributions").update({
      status: "accepted",
      promoted_item_id: promotedId,
      promoted_item_type: targetType,
    }).eq("id", contribution.id);

    toast({ title: "Promoted to library" });
    setSaving(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promote contribution</DialogTitle>
          <DialogDescription>Create a library item from this submission. Original contributor keeps ownership.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePromote} className="space-y-4">
          <div className="space-y-2">
            <Label>Target type</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>{targetType === "tool" ? "Description" : targetType === "prompt" ? "Description" : "Story text"}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} required />
          </div>

          {targetType === "story" && (
            <div className="space-y-2">
              <Label>Attribution</Label>
              <Input value={author} onChange={e => setAuthor(e.target.value)} required />
            </div>
          )}

          {targetType === "prompt" && (
            <>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. neighborhood" />
              </div>
              <div className="space-y-2">
                <Label>Example prompt</Label>
                <Textarea value={examplePrompt} onChange={e => setExamplePrompt(e.target.value)} rows={4} />
              </div>
            </>
          )}

          {targetType === "tool" && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input type="url" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving…" : "Promote"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
