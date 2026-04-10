import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, BookOpen, Wrench, MessageCircle } from "lucide-react";

type ContributionType = "story" | "tool" | "other" | null;

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ContributionDialog = ({ open, onOpenChange, onSuccess }: ContributionDialogProps) => {
  const [contributionType, setContributionType] = useState<ContributionType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Common fields
  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");

  // Story fields
  const [storyDescription, setStoryDescription] = useState("");

  // Tool fields
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolUrl, setToolUrl] = useState("");

  // Other fields
  const [otherText, setOtherText] = useState("");

  const resetForm = () => {
    setContributionType(null);
    setContributorName("");
    setContributorEmail("");
    setStoryDescription("");
    setToolName("");
    setToolDescription("");
    setToolUrl("");
    setOtherText("");
  };

  // Pre-fill from profile
  const prefillFromProfile = () => {
    if (profile?.display_name && !contributorName) setContributorName(profile.display_name);
    if (profile?.email && !contributorEmail) setContributorEmail(profile.email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      let description = "";
      let subject = "";

      if (contributionType === "story") {
        subject = `📖 Story Contribution from ${contributorName}`;
        description = storyDescription;
      } else if (contributionType === "tool") {
        subject = `🔧 Tool Contribution: ${toolName} from ${contributorName}`;
        description = `Tool Name: ${toolName}\nURL: ${toolUrl}\n\nDescription:\n${toolDescription}`;
      } else if (contributionType === "other") {
        subject = `💡 Contribution from ${contributorName}`;
        description = otherText;
      }

      const { error } = await supabase.functions.invoke("notify-contribution", {
        body: {
          contributor_name: contributorName,
          contributor_email: contributorEmail,
          contribution_type: contributionType,
          description,
          subject,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw error;

      toast({
        title: "Contribution submitted!",
        description: "We'll follow up with you soon. Thank you for sharing!",
      });

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
                onClick={() => { setContributionType("story"); prefillFromProfile(); }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">Share a Story</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Tell us about relational tech in your neighborhood — we'll reach out to have a conversation about it
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-2"
                onClick={() => { setContributionType("tool"); prefillFromProfile(); }}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  <span className="font-semibold">Share a Tool</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Share an example of relational tech you've found or built
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-start p-4 gap-2"
                onClick={() => { setContributionType("other"); prefillFromProfile(); }}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">Share something else</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Ideas, feedback, resources, or anything else you'd like to share
                </span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {contributionType === "story" && "Share a Story"}
                {contributionType === "tool" && "Share a Tool"}
                {contributionType === "other" && "Share Something"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common name/email fields */}
              <div className="space-y-2">
                <Label htmlFor="contributorName">Your Name</Label>
                <Input
                  id="contributorName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="Your name..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contributorEmail">Your Email</Label>
                <Input
                  id="contributorEmail"
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {contributionType === "story" && (
                <div className="space-y-2">
                  <Label htmlFor="storyDescription">Tell us briefly about your story</Label>
                  <Textarea
                    id="storyDescription"
                    value={storyDescription}
                    onChange={(e) => setStoryDescription(e.target.value)}
                    rows={5}
                    placeholder="What happened in your neighborhood? We'll reach out to have a conversation about it..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll reach out to have a conversation about your story before it's published.
                  </p>
                </div>
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
                      placeholder="What does this tool do? How does it help neighbors?"
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

              {contributionType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="otherText">What would you like to share?</Label>
                  <Textarea
                    id="otherText"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    rows={5}
                    placeholder="Ideas, feedback, resources, or anything else..."
                    required
                  />
                </div>
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
