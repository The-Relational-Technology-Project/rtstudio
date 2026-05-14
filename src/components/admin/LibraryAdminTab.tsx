import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EditLibraryItemDialog } from "@/components/EditLibraryItemDialog";
import { NewLibraryItemDialog } from "@/components/admin/NewLibraryItemDialog";
import type { LibraryItem, ItemType } from "@/types/library";
import { Pencil, Trash2, GripVertical, Star, Plus } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Row = LibraryItem & {
  createdAt: string;
  isFeatured?: boolean;
  sortOrder?: number;
};

type FilterType = "all" | "story" | "prompt" | "tool";

export const LibraryAdminTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState<string>("");
  const [profiles, setProfiles] = useState<{ id: string; label: string }[]>([]);
  const [newOpen, setNewOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [s, p, t, prof] = await Promise.all([
      supabase.from("stories").select("*").order("created_at", { ascending: false }),
      supabase.from("prompts").select("*").order("created_at", { ascending: false }),
      supabase.from("tools").select("*").order("sort_order", { ascending: true }),
      supabase.from("profiles").select("id, display_name, email"),
    ]);

    const all: Row[] = [
      ...(s.data || []).map((r: any) => ({
        id: r.id, type: "story" as ItemType, title: r.title || "Untitled",
        summary: r.story_text || "", author: r.attribution, fullContent: r.full_story_text,
        userId: r.user_id, createdAt: r.created_at,
      })),
      ...(p.data || []).map((r: any) => ({
        id: r.id, type: "prompt" as ItemType, title: r.title,
        summary: r.description || "No description", category: r.category,
        examplePrompt: r.example_prompt, userId: r.user_id, createdAt: r.created_at,
      })),
      ...(t.data || []).map((r: any) => ({
        id: r.id, type: "tool" as ItemType, title: r.name,
        summary: r.description || "", url: r.url, userId: r.user_id,
        createdAt: r.created_at, isFeatured: r.is_featured, sortOrder: r.sort_order,
        toolCategory: r.tool_category,
      })),
    ];
    setRows(all);
    setProfiles((prof.data || []).map((p: any) => ({
      id: p.id, label: p.display_name || p.email || p.id.slice(0, 8),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (filter !== "all") r = r.filter(x => x.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.title.toLowerCase().includes(q) ||
        (x.author || "").toLowerCase().includes(q)
      );
    }
    if (filter !== "tool") {
      r = [...r].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return r;
  }, [rows, filter, search]);

  const authorLabel = (row: Row) => {
    if (row.author) return row.author;
    if (!row.userId) return "—";
    return profiles.find(p => p.id === row.userId)?.label || row.userId.slice(0, 8);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDelete = async (row: Row) => {
    const table = row.type === "story" ? "stories" : row.type === "prompt" ? "prompts" : "tools";
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      fetchAll();
    }
    setConfirmDelete(null);
  };

  const handleBulkDelete = async () => {
    const byType: Record<string, string[]> = { story: [], prompt: [], tool: [] };
    rows.filter(r => selected.has(r.id)).forEach(r => byType[r.type].push(r.id));
    await Promise.all([
      byType.story.length ? supabase.from("stories").delete().in("id", byType.story) : null,
      byType.prompt.length ? supabase.from("prompts").delete().in("id", byType.prompt) : null,
      byType.tool.length ? supabase.from("tools").delete().in("id", byType.tool) : null,
    ]);
    toast({ title: `Deleted ${selected.size} items` });
    setSelected(new Set());
    setConfirmBulkDelete(false);
    fetchAll();
  };

  const handleReassign = async () => {
    if (!reassignTo) return;
    const ids = Array.from(selected);
    const byType: Record<string, string[]> = { story: [], prompt: [], tool: [] };
    rows.filter(r => ids.includes(r.id)).forEach(r => byType[r.type].push(r.id));
    await Promise.all([
      byType.story.length ? supabase.from("stories").update({ user_id: reassignTo }).in("id", byType.story) : null,
      byType.prompt.length ? supabase.from("prompts").update({ user_id: reassignTo }).in("id", byType.prompt) : null,
      byType.tool.length ? supabase.from("tools").update({ user_id: reassignTo }).in("id", byType.tool) : null,
    ]);
    toast({ title: `Reassigned ${selected.size} items` });
    setSelected(new Set());
    setReassignOpen(false);
    setReassignTo("");
    fetchAll();
  };

  const toggleFeatured = async (row: Row) => {
    const { error } = await supabase.from("tools")
      .update({ is_featured: !row.isFeatured }).eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, isFeatured: !row.isFeatured } : r));
    }
  };

  // Drag-to-reorder for tools (only when filter is "tool")
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const tools = filtered.filter(r => r.type === "tool");
    const oldIdx = tools.findIndex(t => t.id === e.active.id);
    const newIdx = tools.findIndex(t => t.id === e.over!.id);
    const reordered = arrayMove(tools, oldIdx, newIdx);
    // Reassign sort_order in steps of 10
    const updates = reordered.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 10 }));
    setRows(rs => {
      const map = new Map(updates.map(u => [u.id, u.sort_order]));
      return rs.map(r => map.has(r.id) ? { ...r, sortOrder: map.get(r.id) } : r);
    });
    await Promise.all(updates.map(u =>
      supabase.from("tools").update({ sort_order: u.sort_order }).eq("id", u.id)
    ));
    toast({ title: "Order saved" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(["all", "story", "prompt", "tool"] as FilterType[]).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
            </Button>
          ))}
        </div>
        <Input placeholder="Search title or author…" value={search}
          onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm self-center text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setReassignOpen(true)}>Reassign owner</Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmBulkDelete(true)}>Delete</Button>
            </>
          )}
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New item
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  {filter === "tool" && <TableHead className="w-8"></TableHead>}
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                  {filter === "tool" && <TableHead className="w-20">Featured</TableHead>}
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={filtered.filter(r => r.type === "tool").map(r => r.id)}
                  strategy={verticalListSortingStrategy}>
                  {filtered.map(row => (
                    <AdminRow
                      key={row.id}
                      row={row}
                      filter={filter}
                      selected={selected.has(row.id)}
                      onToggle={() => toggleSelect(row.id)}
                      onEdit={() => setEditing(row)}
                      onDelete={() => setConfirmDelete(row)}
                      onToggleFeatured={() => toggleFeatured(row)}
                      authorLabel={authorLabel(row)}
                    />
                  ))}
                </SortableContext>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No items</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {editing && (
        <EditLibraryItemDialog
          item={editing}
          open={true}
          onOpenChange={(o) => !o && setEditing(null)}
          onSuccess={fetchAll}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} items?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign {selected.size} items</AlertDialogTitle>
            <AlertDialogDescription>Choose a new owner.</AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={reassignTo} onValueChange={setReassignTo}>
            <SelectTrigger><SelectValue placeholder="Select owner…" /></SelectTrigger>
            <SelectContent>
              {profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReassign} disabled={!reassignTo}>Reassign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AdminRow = ({
  row, filter, selected, onToggle, onEdit, onDelete, onToggleFeatured, authorLabel,
}: {
  row: Row; filter: FilterType; selected: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  onToggleFeatured: () => void; authorLabel: string;
}) => {
  const isTool = row.type === "tool";
  const sortable = useSortable({ id: row.id, disabled: !isTool || filter !== "tool" });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  return (
    <TableRow ref={sortable.setNodeRef} style={style}>
      <TableCell><Checkbox checked={selected} onCheckedChange={onToggle} /></TableCell>
      {filter === "tool" && (
        <TableCell>
          <span {...sortable.attributes} {...sortable.listeners} className="cursor-grab text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </span>
        </TableCell>
      )}
      <TableCell className="text-xs uppercase text-muted-foreground">{row.type}</TableCell>
      <TableCell className="font-medium max-w-md truncate">{row.title}</TableCell>
      <TableCell className="text-sm">{authorLabel}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString()}
      </TableCell>
      {filter === "tool" && (
        <TableCell>
          <Switch checked={!!row.isFeatured} onCheckedChange={onToggleFeatured} />
        </TableCell>
      )}
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </TableCell>
    </TableRow>
  );
};
