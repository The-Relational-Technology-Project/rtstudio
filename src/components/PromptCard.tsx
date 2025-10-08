import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Wand2, Eye } from "lucide-react";

interface PromptCardProps {
  id: string;
  title: string;
  category: string;
  examplePrompt: string;
  description?: string;
}

export const PromptCard = ({ title, examplePrompt, description }: PromptCardProps) => {
  const [userContext, setUserContext] = useState("");
  const [remixedPrompt, setRemixedPrompt] = useState("");
  const [isRemixing, setIsRemixing] = useState(false);
  const [isRemixDialogOpen, setIsRemixDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRemix = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRemixing(true);

    try {
      const { data, error } = await supabase.functions.invoke("remix-prompt", {
        body: { examplePrompt, userContext },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setRemixedPrompt(data.remixedPrompt);
      toast({
        title: "Prompt remixed!",
        description: "Your customized prompt is ready.",
      });
    } catch (error) {
      console.error("Remix error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remix prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemixing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  return (
    <Card className="border-l-4 border-l-orange-400 hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold font-fraunces mb-4 text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
        )}
        
        <div className="flex gap-2">
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 dark:hover:bg-orange-950 dark:hover:text-orange-400">
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-fraunces">{title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-120px)] pr-4">
                <div className="bg-gradient-to-br from-orange-50/50 to-pink-50/30 dark:from-orange-950/20 dark:to-pink-950/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900">
                  <p className="text-sm leading-relaxed">{examplePrompt}</p>
                </div>
                <Button
                  onClick={() => copyToClipboard(examplePrompt)}
                  variant="outline"
                  className="w-full border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:hover:bg-orange-950 sticky bottom-0 bg-background"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isRemixDialogOpen} onOpenChange={setIsRemixDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 dark:hover:bg-orange-950 dark:hover:text-orange-400">
                <Wand2 className="w-4 h-4 mr-2" />
                Remix
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-fraunces">Remix: {title}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(80vh-120px)] pr-4">
              <form onSubmit={handleRemix} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="context">Your Context & Ideas</Label>
                  <Textarea
                    id="context"
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    rows={6}
                    placeholder="Describe your specific use case, goals, or what you'd like to change about this prompt..."
                    required
                  />
                </div>
                <Button type="submit" disabled={isRemixing} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
                  {isRemixing ? "Remixing..." : "Generate Custom Prompt"}
                </Button>

                {remixedPrompt && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="font-semibold">Your Customized Prompt</Label>
                    <div className="bg-gradient-to-br from-green-50/50 to-blue-50/30 dark:from-green-950/20 dark:to-blue-950/10 p-4 rounded-lg border border-green-200 dark:border-green-900">
                      <p className="text-sm leading-relaxed">{remixedPrompt}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(remixedPrompt)}
                      variant="outline"
                      type="button"
                      className="w-full border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Customized Prompt
                    </Button>
                  </div>
                )}
              </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
