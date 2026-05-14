import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const EmbeddingsTab = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<{ items: number; embedded: number } | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    const [s, p, t, e] = await Promise.all([
      supabase.from("stories").select("id", { count: "exact", head: true }),
      supabase.from("prompts").select("id", { count: "exact", head: true }),
      supabase.from("tools").select("id", { count: "exact", head: true }),
      supabase.from("library_embeddings").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      items: (s.count || 0) + (p.count || 0) + (t.count || 0),
      embedded: e.count || 0,
    });
  };
  useEffect(() => { load(); }, []);

  const reembed = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("admin-reembed");
    setRunning(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Re-embed complete", description: `Embedded ${data?.embedded ?? 0} items` });
      load();
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <Card className="p-6 space-y-3">
        <div className="flex justify-between"><span className="text-muted-foreground">Library items</span><span className="font-mono">{stats?.items ?? "…"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Embedded</span><span className="font-mono">{stats?.embedded ?? "…"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Missing</span>
          <span className="font-mono">{stats ? Math.max(0, stats.items - stats.embedded) : "…"}</span>
        </div>
        <Button onClick={reembed} disabled={running} className="w-full">
          {running ? "Re-embedding…" : "Re-embed all"}
        </Button>
      </Card>
    </div>
  );
};
