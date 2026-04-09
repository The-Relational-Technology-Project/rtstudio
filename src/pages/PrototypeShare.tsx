import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

const PrototypeShare = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [code, setCode] = useState<string | null>(null);
  const [toolName, setToolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchPrototype = async () => {
      // Use a direct fetch to avoid RLS issues for anon users viewing shared prototypes
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/prototypes?share_id=eq.${shareId}&select=generated_code,tool_name,share_view_count`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const items = await response.json();
      const data = items?.[0];

      if (!data) {
        setError("Prototype not found");
        setLoading(false);
        return;
      }

      setCode(data.generated_code);
      setToolName(data.tool_name);
      setLoading(false);

      // Increment view count (fire and forget)
      supabase
        .from("prototypes")
        .update({ share_view_count: (data.share_view_count || 0) + 1, is_shared: true })
        .eq("share_id", shareId)
        .then(() => {});
    };

    fetchPrototype();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading prototype...</p>
      </div>
    );
  }

  if (error || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg text-foreground">{error || "Not found"}</p>
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Back to Relational Tech Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Banner */}
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 text-center">
        <p className="text-xs text-muted-foreground">
          {toolName ? `"${toolName}"` : "A neighbor"} is prototyping a neighborhood tool —{" "}
          <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
            Built with Relational Tech Studio
            <ExternalLink className="w-3 h-3" />
          </Link>
        </p>
      </div>

      {/* Prototype iframe */}
      <div className="flex-1">
        <iframe
          srcDoc={code}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 40px)" }}
          title={toolName || "Prototype"}
        />
      </div>
    </div>
  );
};

export default PrototypeShare;
