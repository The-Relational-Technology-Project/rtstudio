import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Hammer, Sparkles, Loader2 } from "lucide-react";

interface PromptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  remaining: number;
  onConfirm: (editedPrompt: string) => void;
  isGenerating: boolean;
}

const BUILD_STEPS = [
  "Reading your prompt…",
  "Designing the layout…",
  "Adding interactions…",
  "Polishing the details…",
  "Almost there…",
];

export const PromptReviewModal = ({
  open, onOpenChange, prompt, remaining, onConfirm, isGenerating
}: PromptReviewModalProps) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [buildStep, setBuildStep] = useState(0);

  useEffect(() => {
    if (open) {
      setEditedPrompt(prompt);
      setBuildStep(0);
    }
  }, [open, prompt]);

  // Cycle through build steps while generating
  useEffect(() => {
    if (!isGenerating) {
      setBuildStep(0);
      return;
    }
    const interval = setInterval(() => {
      setBuildStep((s) => (s + 1) % BUILD_STEPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-10 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Hammer className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-fraunces text-lg font-semibold text-foreground">
                Building your prototype
              </p>
              <p className="text-sm text-muted-foreground animate-pulse">
                {BUILD_STEPS[buildStep]}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                This usually takes 30–60 seconds
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-fraunces">
                <Hammer className="w-5 h-5 text-primary" />
                Review your build prompt
              </DialogTitle>
              <DialogDescription>
                This prompt came from your Sidekick conversation. Make any tweaks you'd like before building your prototype.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[200px] text-sm font-mono resize-y"
                placeholder="Describe the prototype you want to build..."
              />
              <p className="text-xs text-muted-foreground">
                {remaining} build{remaining !== 1 ? "s" : ""} remaining today
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(editedPrompt)}
                disabled={!editedPrompt.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Hammer className="w-4 h-4 mr-2" />
                Build it
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
