import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";

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

type SortKey =
  | "display_name"
  | "neighborhood"
  | "commitments_count"
  | "prototypes_count"
  | "serviceberries_total"
  | "created_at"
  | "last_active";
type SortDir = "asc" | "desc";

const NUMERIC_KEYS: SortKey[] = [
  "commitments_count",
  "prototypes_count",
  "serviceberries_total",
];
const DATE_KEYS: SortKey[] = ["created_at", "last_active"];

export const BuildersTab = () => {
  const [rows, setRows] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("prototypes_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_builders_overview");
      if (!error) setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(NUMERIC_KEYS.includes(key) || DATE_KEYS.includes(key) ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = !q
      ? rows
      : rows.filter(r =>
          (r.display_name || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.neighborhood || "").toLowerCase().includes(q)
        );

    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (NUMERIC_KEYS.includes(sortKey)) {
        cmp = (Number(av) || 0) - (Number(bv) || 0);
      } else if (DATE_KEYS.includes(sortKey)) {
        cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
      } else {
        const as = ((av as string) || "").toLowerCase();
        const bs = ((bv as string) || "").toLowerCase();
        // Empty strings always sort last
        if (!as && bs) cmp = 1;
        else if (as && !bs) cmp = -1;
        else cmp = as.localeCompare(bs);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  const SortHeader = ({
    label, k, align = "left", className = "",
  }: { label: string; k: SortKey; align?: "left" | "right"; className?: string }) => {
    const active = sortKey === k;
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
            align === "right" ? "justify-end w-full" : ""
          } ${active ? "text-foreground font-medium" : ""}`}
        >
          {label}
          {active && (sortDir === "asc"
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />)}
        </button>
      </TableHead>
    );
  };

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
                <SortHeader label="Name" k="display_name" />
                <TableHead>Email</TableHead>
                <SortHeader label="Neighborhood" k="neighborhood" />
                <SortHeader label="Commits" k="commitments_count" align="right" className="text-right" />
                <SortHeader label="Protos" k="prototypes_count" align="right" className="text-right" />
                <SortHeader label="Berries" k="serviceberries_total" align="right" className="text-right" />
                <SortHeader label="Joined" k="created_at" className="w-32" />
                <SortHeader label="Last active" k="last_active" className="w-32" />
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
