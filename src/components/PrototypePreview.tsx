import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Share2, Download, Code, FileText, Minimize2, Maximize2,
  RefreshCw, Send, ExternalLink, Copy
} from "lucide-react";

interface PrototypePreviewProps {
  code: string;
  prompt: string;
  prototypeId: string;
  shareId: string;
  toolName?: string;
  remaining: number;
  onRefine: (refinement: string) => void;
  isRefining?: boolean;
}

export const PrototypePreview = ({
  code, prompt, prototypeId, shareId, toolName,
  remaining, onRefine, isRefining = false
}: PrototypePreviewProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [showEmbed, setShowEmbed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/p/${shareId}`;
  const embedSnippet = `<iframe src="${window.location.origin}/p/${shareId}/embed" width="100%" height="600" frameborder="0"></iframe>`;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    copyToClipboard(shareUrl, "Share link");
  };

  const handleDownloadCode = () => {
    const filename = toolName
      ? `${toolName.toLowerCase().replace(/\s+/g, "-")}-prototype.html`
      : "prototype.html";
    downloadFile(code, filename, "text/html");
  };

  const handleDownloadPrompt = () => {
    const filename = toolName
      ? `${toolName.toLowerCase().replace(/\s+/g, "-")}-prompt.txt`
      : "prototype-prompt.txt";
    downloadFile(prompt, filename, "text/plain");
  };

  const handleRefineSubmit = () => {
    if (!refinementText.trim() || isRefining) return;
    onRefine(refinementText.trim());
    setRefinementText("");
    setShowRefine(false);
  };

  if (collapsed) {
    return (
      <Card
        className={`p-3 border-2 border-primary/30 bg-primary/5 cursor-pointer transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        onClick={() => setCollapsed(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {toolName || "Prototype"} preview
            </span>
          </div>
          <Maximize2 className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`space-y-3 transition-all duration-400 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <Card className="border-2 border-primary/30 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-primary/5 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold font-fraunces">
              {toolName || "Prototype"} Preview
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 p-0"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Iframe */}
        <div className="relative bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={code}
            sandbox="allow-scripts"
            className="w-full border-0"
            style={{ minHeight: "400px", maxHeight: "700px", height: "500px" }}
            title="Prototype preview"
          />
        </div>

        {/* Action buttons */}
        <div className="p-3 bg-card border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleShare}>
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownloadCode}>
              <Download className="w-3 h-3 mr-1" />
              Code
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownloadPrompt}>
              <FileText className="w-3 h-3 mr-1" />
              Prompt
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowEmbed(!showEmbed)}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Embed
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowRefine(!showRefine)}
              disabled={remaining <= 0}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refine {remaining > 0 ? `(${remaining} left)` : ""}
            </Button>
          </div>

          {/* Embed snippet */}
          {showEmbed && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Copy this embed code:</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded border border-border overflow-x-auto block">
                  {embedSnippet}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => copyToClipboard(embedSnippet, "Embed code")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Refine input */}
          {showRefine && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="Describe what you'd like to change..."
                className="min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRefineSubmit();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {remaining} build{remaining !== 1 ? "s" : ""} remaining today
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleRefineSubmit}
                  disabled={!refinementText.trim() || isRefining}
                >
                  {isRefining ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Refine
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
