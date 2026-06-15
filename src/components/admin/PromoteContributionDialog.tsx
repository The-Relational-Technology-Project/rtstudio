import { useEffect, useState } from "react";
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
  image_paths: string[];
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
  const [tryUrl, setTryUrl] = useState(contribution.links?.[0] || "");
  const [githubUrl, setGithubUrl] = useState(
    contribution.links?.find(l => /github\.com/i.test(l)) || ""
  );
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(
    contribution.image_paths?.[0] || null
  );
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const paths = contribution.image_paths || [];
      if (paths.length === 0) return;
      const entries: Record<string, string> = {};
      await Promise.all(paths.map(async (p) => {
        const { data } = await supabase.storage
          .from("contribution-uploads")
          .createSignedUrl(p, 3600);
        if (data?.signedUrl) entries[p] = data.signedUrl;
      }));
      if (!cancelled) setImagePreviews(entries);
    })();
    return () => { cancelled = true; };
  }, [contribution.image_paths]);

  // Copy a selected private contribution image into the public story-images bucket
  // and return the public URL. Returns null if nothing selected or copy fails.
  const publishSelectedImage = async (): Promise<string | null> => {
    if (!selectedImagePath) return null;
    const { data: blob, error: dlErr } = await supabase.storage
      .from("contribution-uploads")
      .download(selectedImagePath);
    if (dlErr || !blob) {
      toast({ title: "Image copy failed", description: dlErr?.message || "download error", variant: "destructive" });
      return null;
    }
    const ext = selectedImagePath.split(".").pop() || "png";
    const destPath = `promoted/${contribution.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("story-images")
      .upload(destPath, blob, { contentType: blob.type, upsert: false });
    if (upErr) {
      toast({ title: "Image copy failed", description: upErr.message, variant: "destructive" });
      return null;
    }
    const { data: pub } = supabase.storage.from("story-images").getPublicUrl(destPath);
    return pub.publicUrl;
  };

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
      const imageUrl = await publishSelectedImage();
      const { data, error: e } = await supabase.from("tools").insert({
        name: title,
        description,
        url: tryUrl || null,
        github_url: githubUrl || null,
        image_url: imageUrl,
        user_id: contribution.user_id,
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

  const imagePaths = contribution.image_paths || [];

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
            <Label>{targetType === "story" ? "Story text" : "Description"}</Label>
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
            <>
              <div className="space-y-2">
                <Label>Try It URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  type="url"
                  value={tryUrl}
                  onChange={e => setTryUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub repo URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/…"
                />
              </div>

              <div className="space-y-2">
                <Label>Screenshot</Label>
                {imagePaths.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No images attached to this contribution.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePaths.map((p) => {
                      const isSel = selectedImagePath === p;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setSelectedImagePath(isSel ? null : p)}
                          className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${
                            isSel ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          {imagePreviews[p] ? (
                            <img src={imagePreviews[p]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-muted animate-pulse" />
                          )}
                          {isSel && (
                            <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Selected image becomes the tool's screenshot (visible on the card and in the detail view).
                </p>
              </div>
            </>
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
