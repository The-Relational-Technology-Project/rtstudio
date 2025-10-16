import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink } from "lucide-react";

interface PromptCardProps {
  id: string;
  title: string;
  category: string;
  examplePrompt: string;
  description?: string;
  exampleUrl?: string;
  onRemix?: (promptText: string) => void;
}

export const PromptCard = ({ title, examplePrompt, description, exampleUrl, onRemix }: PromptCardProps) => {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-all" data-tour="prompt-card">
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold font-fraunces mb-4 text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2">
          {exampleUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full sm:w-auto flex-1"
            >
              <a href={exampleUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Example
              </a>
            </Button>
          )}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex-1">
                Read
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="font-fraunces">{title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] pr-2 sm:pr-4">
                <div className="bg-secondary/50 border border-border p-3 sm:p-4 rounded-xl">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">{examplePrompt}</pre>
                </div>
                <Button
                  onClick={() => copyToClipboard(examplePrompt)}
                  variant="outline"
                  className="w-full sticky bottom-0 bg-background"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto flex-1"
            onClick={() => onRemix?.(examplePrompt)}
          >
            Remix
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
