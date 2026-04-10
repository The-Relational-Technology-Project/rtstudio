import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Code, Minimize2, Maximize2, ExternalLink
} from "lucide-react";

interface PrototypePreviewProps {
  code: string;
  prompt: string;
  prototypeId: string;
  shareId: string;
  toolName?: string;
}

export const PrototypePreview = ({
  code, prompt, prototypeId, shareId, toolName,
}: PrototypePreviewProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/p/${shareId}`;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleViewAndShare = async () => {
    // Mark as shared in DB
    await supabase
      .from("prototypes")
      .update({ is_shared: true })
      .eq("id", prototypeId);
    window.open(shareUrl, "_blank");
  };

  const handleDownloadCode = () => {
    const filename = toolName
      ? `${toolName.toLowerCase().replace(/\s+/g, "-")}-prototype.html`
      : "prototype.html";
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            sandbox="allow-scripts allow-same-origin"
            className="w-full border-0"
            style={{ minHeight: "400px", maxHeight: "700px", height: "500px" }}
            title="Prototype preview"
          />
        </div>

        {/* Action buttons */}
        <div className="p-3 bg-card border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleViewAndShare}>
              <ExternalLink className="w-3 h-3 mr-1" />
              View and share
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownloadCode}>
              <Download className="w-3 h-3 mr-1" />
              Code
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
