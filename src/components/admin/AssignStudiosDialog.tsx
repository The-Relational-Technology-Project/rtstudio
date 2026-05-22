import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export type Studio = { slug: string; label: string; color: string | null };

type SelectedItem = { id: string; type: "story" | "prompt" | "tool" };

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studios: Studio[];
  selected: SelectedItem[];
  onSuccess: () => void;
}

export const AssignStudiosDialog = ({ open, onOpenChange, studios, selected, onSuccess }: Props) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (slug: string) => {
    const next = new Set(chosen);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    setChosen(next);
  };

  const handleSubmit = async () => {
    if (chosen.size === 0 || selected.length === 0) return;
    setSaving(true);
    const slugs = Array.from(chosen);

    if (mode === "add") {
      const rows = selected.flatMap(item =>
        slugs.map(slug => ({ studio_slug: slug, item_type: item.type, item_id: item.id }))
      );
      const { error } = await supabase.from("library_studio_assignments")
        .upsert(rows, { onConflict: "studio_slug,item_type,item_id" });
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
    } else {
      // Remove: delete matching rows
      for (const slug of slugs) {
        for (const t of ["story", "prompt", "tool"] as const) {
          const ids = selected.filter(s => s.type === t).map(s => s.id);
          if (!ids.length) continue;
          const { error } = await supabase.from("library_studio_assignments")
            .delete().eq("studio_slug", slug).eq("item_type", t).in("item_id", ids);
          if (error) {
            toast({ title: "Failed", description: error.message, variant: "destructive" });
            setSaving(false); return;
          }
        }
      }
    }

    toast({ title: mode === "add" ? "Studios assigned" : "Studios removed" });
    setChosen(new Set());
    setSaving(false);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setChosen(new Set()); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign studios</DialogTitle>
          <DialogDescription>
            {selected.length} item{selected.length === 1 ? "" : "s"} selected.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "add" | "remove")} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="add" id="mode-add" />
            <Label htmlFor="mode-add">Add to selected</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="remove" id="mode-remove" />
            <Label htmlFor="mode-remove">Remove from selected</Label>
          </div>
        </RadioGroup>

        <div className="space-y-2">
          {studios.map(s => (
            <label key={s.slug} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={chosen.has(s.slug)} onCheckedChange={() => toggle(s.slug)} />
              <span
                className="inline-block w-3 h-3 rounded-full border border-border"
                style={s.color ? { backgroundColor: s.color } : undefined}
              />
              <span>{s.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{s.slug}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || chosen.size === 0}>
            {saving ? "Saving…" : (mode === "add" ? "Add studios" : "Remove studios")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
