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
import { Hammer, Sparkles } from "lucide-react";

interface PromptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  remaining: number;
  onConfirm: (editedPrompt: string) => void;
  isGenerating: boolean;
}

export const PromptReviewModal = ({
  open, onOpenChange, prompt, remaining, onConfirm, isGenerating
}: PromptReviewModalProps) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  // Sync editedPrompt whenever the prompt prop changes or the modal opens
  useEffect(() => {
    if (open) {
      setEditedPrompt(prompt);
    }
  }, [open, prompt]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(editedPrompt)}
            disabled={!editedPrompt.trim() || isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Building your prototype...
              </>
            ) : (
              <>
                <Hammer className="w-4 h-4 mr-2" />
                Build it
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
