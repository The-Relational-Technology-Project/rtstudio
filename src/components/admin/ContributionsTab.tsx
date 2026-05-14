import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PromoteContributionDialog } from "./PromoteContributionDialog";

type Contribution = {
  id: string;
  title: string;
  description: string;
  links: string[];
  image_paths: string[];
  contributor_name: string;
  contributor_email: string;
  user_id: string;
  status: string;
  created_at: string;
  promoted_item_type?: string | null;
};

export const ContributionsTab = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<Contribution | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("contributions").update({ status: "dismissed" }).eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Dismissed" }); fetch(); }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Contributor</TableHead>
                <TableHead className="w-32">Submitted</TableHead>
                <TableHead className="w-48 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(c => (
                <Fragment key={c.id}>
                  <TableRow className="cursor-pointer"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    <TableCell>
                      <Badge variant={c.status === "new" ? "default" : "outline"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm">{c.contributor_name}<br/>
                      <span className="text-xs text-muted-foreground">{c.contributor_email}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-1" onClick={e => e.stopPropagation()}>
                      {c.status === "new" && (
                        <>
                          <Button size="sm" onClick={() => setPromoting(c)}>Promote</Button>
                          <Button size="sm" variant="outline" onClick={() => dismiss(c.id)}>Dismiss</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  {expanded === c.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <div className="space-y-2 py-2">
                          <p className="text-sm whitespace-pre-wrap">{c.description}</p>
                          {c.links?.length > 0 && (
                            <div className="text-sm">
                              <strong>Links:</strong>
                              <ul className="list-disc ml-5">
                                {c.links.map(l => <li key={l}><a href={l} target="_blank" rel="noreferrer" className="text-primary underline">{l}</a></li>)}
                              </ul>
                            </div>
                          )}
                          {c.image_paths?.length > 0 && (
                            <p className="text-xs text-muted-foreground">{c.image_paths.length} image(s) in contribution-uploads</p>
                          )}
                          {c.promoted_item_type && (
                            <p className="text-xs text-muted-foreground">Promoted to: {c.promoted_item_type}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No contributions yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {promoting && (
        <PromoteContributionDialog
          contribution={promoting}
          open={true}
          onOpenChange={(o) => !o && setPromoting(null)}
          onSuccess={() => { setPromoting(null); fetch(); }}
        />
      )}
    </div>
  );
};
