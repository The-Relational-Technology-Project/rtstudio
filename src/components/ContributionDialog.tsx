import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, X, ImagePlus, Loader2, ExternalLink } from "lucide-react";

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_LINKS = 3;

const CATEGORIES = [
  { value: "Tool", label: "Tool" },
  { value: "Story", label: "Story" },
  { value: "Resource", label: "Resource" },
  { value: "Idea", label: "Idea" },
  { value: "Feedback", label: "Feedback" },
  { value: "Other", label: "Other" },
];

export const ContributionDialog = ({ open, onOpenChange, onSuccess }: ContributionDialogProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [images, setImages] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isToolCategory = category === "Tool";

  // Name/email come from the profile — not editable in the form
  const contributorName =
    profile?.display_name || profile?.full_name || "";
  const contributorEmail = profile?.email || user?.email || "";

  // Reset transient state when reopening
  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  const resetForm = () => {
    setCategory("");
    setTitle("");
    setDescription("");
    setGithubUrl("");
    setLiveUrl("");
    setLinks([""]);
    setImages([]);
    setSubmitted(false);
  };

  const updateLink = (i: number, value: string) => {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? value : l)));
  };

  const addLink = () => {
    if (links.length < MAX_LINKS) setLinks((prev) => [...prev, ""]);
  };

  const removeLink = (i: number) => {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const accepted: File[] = [];
    for (const f of files.slice(0, remaining)) {
      if (f.size > MAX_IMAGE_BYTES) {
        toast({
          title: "Image too large",
          description: `${f.name} is over 10MB. Please resize and try again.`,
          variant: "destructive",
        });
        continue;
      }
      accepted.push(f);
    }
    setImages((prev) => [...prev, ...accepted]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contribute to the commons.",
        variant: "destructive",
      });
      return;
    }
    if (!category) {
      toast({
        title: "Pick a category",
        description: "Let us know what kind of contribution this is.",
        variant: "destructive",
      });
      return;
    }
    if (!contributorEmail) {
      toast({
        title: "Missing email",
        description: "We couldn't find your email on file. Update your profile and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const imagePaths: string[] = [];
      for (const file of images) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from("contribution-uploads")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadErr) throw uploadErr;
        imagePaths.push(path);
      }

      const { data: { session } } = await supabase.auth.getSession();
      // Prepend dedicated tool URLs into the generic links array so they
      // travel through the existing notify-contribution + promote pipeline
      // (PromoteContributionDialog already auto-detects github.com URLs).
      const toolLinks = isToolCategory
        ? [githubUrl.trim(), liveUrl.trim()].filter(Boolean)
        : [];
      const cleanedLinks = [...toolLinks, ...links.map((l) => l.trim()).filter(Boolean)];

      const { error: fnErr } = await supabase.functions.invoke("notify-contribution", {
        body: {
          category,
          title: title.trim(),
          description: description.trim(),
          links: cleanedLinks,
          imagePaths,
          contributor_name: contributorName.trim(),
          contributor_email: contributorEmail.trim(),
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (fnErr) throw fnErr;

      const { error: berryErr } = await supabase.rpc("award_serviceberries", {
        p_user_id: user.id,
        p_amount: 1,
        p_reason: "contribution_shared",
      });
      if (berryErr) console.error("Serviceberry award failed:", berryErr);

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      console.error("Contribution submit error:", err);
      toast({
        title: "Something went wrong",
        description: "We couldn't submit your contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(resetForm, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6 px-2">
            <div className="relative mb-5 animate-in zoom-in-50 duration-500">
              <div
                className="w-16 h-16 rounded-full shadow-lg"
                style={{
                  background: "radial-gradient(circle at 30% 30%, hsl(15 75% 65%), hsl(15 70% 45%))",
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ background: "hsl(15 75% 55%)" }}
              />
            </div>

            <DialogHeader className="items-center text-center mb-2">
              <DialogTitle className="text-2xl font-serif">Thank you for your gift</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-2 max-w-sm">
              You've added a serviceberry to the commons. We sent a copy to your email and to
              Deborah Tien, one of the stewards — she'll be in touch soon.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Want to talk it through sooner? Josh, another steward, would love to chat.
            </p>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button asChild className="gap-2">
                <a
                  href="https://cal.com/joshnesbit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule a chat with Josh
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">Contribute</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Share a story, a tool, an idea, feedback, resources. All of these are gifts to us.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Type of contribution</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title">Short description</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A short description of your contribution"
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Your contribution</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share what you'd like to add to the commons…"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Links <span className="text-muted-foreground font-normal">(optional)</span></Label>
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => updateLink(i, e.target.value)}
                      placeholder="https://…"
                    />
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(i)}
                        aria-label="Remove link"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {links.length < MAX_LINKS && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLink}
                    className="gap-1 text-muted-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add link
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Images <span className="text-muted-foreground font-normal">(optional, up to {MAX_IMAGES})</span>
                </Label>
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {images.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 bg-background border rounded-full p-0.5 shadow hover:bg-muted"
                          aria-label="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length < MAX_IMAGES && (
                  <label className="flex items-center gap-2 border border-dashed rounded-md px-3 py-2 cursor-pointer text-sm text-muted-foreground hover:bg-muted/50 w-fit">
                    <ImagePlus className="w-4 h-4" />
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImagesSelected}
                    />
                  </label>
                )}
              </div>

              {/* Read-only sender info from profile */}
              <div className="rounded-md bg-muted/40 border border-border px-3 py-2.5 text-sm">
                <p className="text-xs text-muted-foreground mb-0.5">Sending as</p>
                <p className="text-foreground">
                  {contributorName || "Builder"}
                  {contributorEmail && (
                    <span className="text-muted-foreground"> · {contributorEmail}</span>
                  )}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                We'll send this to Deborah Tien, one of the stewards, and she'll be in touch with you.
              </p>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
