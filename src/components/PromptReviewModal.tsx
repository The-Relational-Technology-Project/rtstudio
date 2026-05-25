import { useState, useEffect, useRef } from "react";
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
import { Hammer, ImagePlus, X, Loader2 } from "lucide-react";
import { resizeImageToBase64, type ResizedImage } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";

export interface ReferenceImage {
  mediaType: string;
  base64: string;
}

interface PromptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  remaining: number;
  onConfirm: (editedPrompt: string, referenceImages: ReferenceImage[]) => void;
  onCancel?: () => void;
  isGenerating: boolean;
}

const BUILD_STEPS = [
  "Reading your prompt…",
  "Designing the layout…",
  "Adding interactions…",
  "Polishing the details…",
  "Almost there…",
];

const MAX_IMAGES = 2;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PromptReviewModal = ({
  open, onOpenChange, prompt, remaining, onConfirm, onCancel, isGenerating
}: PromptReviewModalProps) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [buildStep, setBuildStep] = useState(0);
  const [images, setImages] = useState<ResizedImage[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [cancelAvailable, setCancelAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setEditedPrompt(prompt);
      setBuildStep(0);
      setImages([]);
    }
  }, [open, prompt]);

  useEffect(() => {
    if (!isGenerating) {
      setBuildStep(0);
      setCancelAvailable(false);
      return;
    }
    const interval = setInterval(() => {
      setBuildStep((s) => (s + 1) % BUILD_STEPS.length);
    }, 8000);
    // Show the cancel option after 60s so users have an exit if it hangs.
    const cancelTimer = window.setTimeout(() => setCancelAvailable(true), 60_000);
    return () => {
      clearInterval(interval);
      window.clearTimeout(cancelTimer);
    };
  }, [isGenerating]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so same file can be re-selected
    if (!files.length) return;

    const slotsLeft = MAX_IMAGES - images.length;
    const toProcess = files.slice(0, slotsLeft);

    setIsResizing(true);
    try {
      const newImages: ResizedImage[] = [];
      for (const file of toProcess) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Not an image", description: `${file.name} isn't an image file.`, variant: "destructive" });
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "Image too large", description: `${file.name} is over 10MB. Try a smaller one.`, variant: "destructive" });
          continue;
        }
        try {
          const resized = await resizeImageToBase64(file, 1000, 0.8);
          newImages.push(resized);
        } catch (err) {
          console.error("Resize error:", err);
          toast({ title: "Couldn't process image", description: `${file.name} failed to load.`, variant: "destructive" });
        }
      }
      if (newImages.length) setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    } finally {
      setIsResizing(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    onConfirm(
      editedPrompt,
      images.map(({ mediaType, base64 }) => ({ mediaType, base64 }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => { if (isGenerating) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isGenerating) e.preventDefault(); }}
      >
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
                This usually takes 1–3 minutes. You can leave this tab open.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2 italic">
                This is a good time to stretch, make tea, or text a neighbor 🙂
              </p>
            </div>
            {onCancel && cancelAvailable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel build
              </Button>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-fraunces">
                <Hammer className="w-5 h-5 text-primary" />
                Review your build prompt
              </DialogTitle>
              <DialogDescription>
                This prompt came from your Sidekick conversation. Make any tweaks you'd like before building your prototype. The Studio preview shows one page with the main flow working and other sections stubbed — take the prompt to Claude Code or Lovable for the full multi-page version.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[200px] text-sm font-mono resize-y"
                placeholder="Describe the prototype you want to build..."
              />

              {/* Reference images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">
                    Visual references <span className="text-muted-foreground font-normal">(optional, up to {MAX_IMAGES})</span>
                  </p>
                  {isResizing && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Resizing…
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.dataUrl}
                        alt={`Reference ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isResizing}
                      className="w-20 h-20 rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-accent/30 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Add</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Reference images help shape the look & feel — colors, mood, layout vibe. Not used as literal specs.
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                {remaining} build{remaining !== 1 ? "s" : ""} remaining today
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!editedPrompt.trim() || isResizing}
                className="bg-primary hover:bg-primary/90"
              >
                <Hammer className="w-4 h-4 mr-2" />
                Build a prototype
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
