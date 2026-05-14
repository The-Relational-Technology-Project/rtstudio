import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Builder = {
  id: string;
  email: string | null;
  display_name: string | null;
  neighborhood: string | null;
  created_at: string;
  commitments_count: number;
  prototypes_count: number;
  serviceberries_total: number;
  last_active: string;
};

export const BuildersTab = () => {
  const [rows, setRows] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_builders_overview");
      if (!error) setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      (r.display_name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.neighborhood || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <Input placeholder="Search name, email, neighborhood…" value={search}
        onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Neighborhood</TableHead>
                <TableHead className="text-right">Commits</TableHead>
                <TableHead className="text-right">Protos</TableHead>
                <TableHead className="text-right">Berries</TableHead>
                <TableHead className="w-32">Joined</TableHead>
                <TableHead className="w-32">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.display_name || "—"}</TableCell>
                  <TableCell className="text-sm">{b.email || "—"}</TableCell>
                  <TableCell className="text-sm">{b.neighborhood || "—"}</TableCell>
                  <TableCell className="text-right">{b.commitments_count}</TableCell>
                  <TableCell className="text-right">{b.prototypes_count}</TableCell>
                  <TableCell className="text-right">{b.serviceberries_total}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(b.last_active).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No builders</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
