import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Check, X } from "lucide-react";

type ConnectionRequest = {
  id: string;
  created_at: string;
  requester_user_id: string | null;
  item_type: string;
  item_id: string;
  item_title: string;
  message: string;
  conversation_snippet: string | null;
  status: "new" | "sent" | "declined";
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  email: string | null;
  neighborhood: string | null;
};

export const ConnectionRequestsTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ConnectionRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "sent" | "declined">("new");

  const fetchAll = async () => {
    setLoading(true);
    const { data: reqs } = await supabase
      .from("connection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (reqs as ConnectionRequest[]) || [];
    setRows(list);
    const ids = Array.from(new Set(list.map(r => r.requester_user_id).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, email, neighborhood")
        .in("id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const setStatus = async (id: string, status: "sent" | "declined") => {
    const { error } = await supabase
      .from("connection_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setRows(rs => rs.map(r => r.id === id ? { ...r, status } : r));
      toast({ title: status === "sent" ? "Marked as sent" : "Declined" });
    }
  };

  const visible = filter === "all" ? rows : rows.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(["new", "sent", "declined", "all"] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1 text-xs opacity-70">
                ({rows.filter(r => r.status === f).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No requests in this view.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Date</TableHead>
                <TableHead>Builder</TableHead>
                <TableHead>Wants intro to</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(r => {
                const p = r.requester_user_id ? profiles[r.requester_user_id] : null;
                return (
                  <TableRow key={r.id} className="align-top">
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{p?.display_name || "Unknown"}</div>
                      {p?.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                      {p?.neighborhood && <div className="text-xs text-muted-foreground italic">{p.neighborhood}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <a
                        href={`/library?item=${r.item_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline text-foreground"
                      >
                        {r.item_title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="text-xs text-muted-foreground uppercase mt-0.5">{r.item_type}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      {r.message && <p className="whitespace-pre-wrap">{r.message}</p>}
                      {r.conversation_snippet && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Conversation snippet</summary>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 pl-2 border-l border-border">
                            {r.conversation_snippet}
                          </p>
                        </details>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "new" ? "default" : r.status === "sent" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "new" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "sent")}>
                            <Check className="h-3 w-3 mr-1" /> Sent
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "declined")}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
